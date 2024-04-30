use chrono::prelude::*;
use crc32fast::Hasher;
use neon::context::ModuleContext;
use neon::prelude::*;
use neon::types::buffer::TypedArray;
use std::fs::{metadata, read, Metadata};
use std::io::Result;
use std::os::unix::fs::PermissionsExt;
use std::path::Path;

fn read_file(path: &str) -> Result<Vec<u8>> {
    let contents = read(path)?;
    Ok(contents)
}

fn get_arg_as_bool(index: usize, cx: &mut FunctionContext) -> bool {
    match cx.argument_opt(index as i32) {
        Some(arg) => {
            if arg.is_a::<JsBoolean, _>(cx) {
                arg.downcast::<JsBoolean, _>(cx).unwrap().value(cx)
            } else {
                false // or some default value
            }
        }
        None => {
            false // or some default value
        }
    }
}

fn metadata_return(metadata: Metadata) -> Vec<String> {
    let mut result: Vec<String> = Vec::new();
    match metadata.created() {
        Ok(time) => {
            let datetime: DateTime<Utc> = DateTime::from(time);
            result.push(datetime.to_rfc3339());
        }
        Err(_) => {
            result.push("Could not retrieve creation time".to_string());
        }
    }

    match metadata.accessed() {
        Ok(time) => {
            let datetime: DateTime<Utc> = DateTime::from(time);
            result.push(datetime.to_rfc3339());
        }
        Err(_) => {
            result.push("Could not retrieve creation time".to_string());
        }
    }

    match metadata.modified() {
        Ok(time) => {
            let datetime: DateTime<Utc> = DateTime::from(time);
            result.push(datetime.to_rfc3339());
        }
        Err(_) => {
            result.push("Could not retrieve creation time".to_string());
        }
    }

    result
}

pub(crate) fn crc(mut cx: FunctionContext) -> JsResult<JsPromise> {
    let path = cx.argument::<JsString>(0)?.value(&mut cx);
    let return_object = get_arg_as_bool(1, &mut cx);
    let return_content_as_buffer = get_arg_as_bool(2, &mut cx);
    let return_metadata_time = get_arg_as_bool(3, &mut cx);

    let (deferred, promise) = cx.promise();

    match read_file(&path) {
        Err(e) => {
            let js_error = cx.error(e.to_string())?;
            deferred.reject(&mut cx, js_error);
            Ok(promise)
        }
        Ok(contents) => {
            let buffer = if contents.is_empty() {
                path.as_bytes().to_vec()
            } else {
                contents.clone()
            };

            let mut result: Vec<u32> = Vec::new();
            let contents = buffer.as_slice();
            let mut hasher = Hasher::new();
            hasher.update(contents);
            let crc32 = hasher.finalize();
            result.push(crc32);

            if return_object {
                let k_crc32data = JsObject::new(&mut cx);
                let index = cx.string(&path);
                let crc32 = cx.string(format!("{:x}", result[0]));
                let dirname = cx.string(Path::new(&path).parent().unwrap().to_str().unwrap());
                let filename = cx.string(Path::new(&path).file_name().unwrap().to_str().unwrap());
                let size = cx.number(contents.len() as f64);
                let metadata = metadata(&path).unwrap();
                let permissions = metadata.permissions();
                let mode = cx.string(permissions_to_string(permissions.mode()));

                k_crc32data.set(&mut cx, "index", index).unwrap();
                k_crc32data.set(&mut cx, "crc32", crc32).unwrap();
                k_crc32data.set(&mut cx, "path", dirname).unwrap();
                k_crc32data.set(&mut cx, "filename", filename).unwrap();
                k_crc32data.set(&mut cx, "size", size).unwrap();
                k_crc32data.set(&mut cx, "mode", mode).unwrap();
                if return_content_as_buffer {
                    let mut buf = cx.buffer(contents.len() as u32 as usize)?;
                    buf.as_mut_slice(&mut cx).copy_from_slice(contents);
                    k_crc32data.set(&mut cx, "data", buf).unwrap();
                } else {
                    let content_should_be_activated = cx.string("content should be activated");
                    k_crc32data
                        .set(&mut cx, "data", content_should_be_activated)
                        .unwrap();
                }
                if return_metadata_time {
                    let metadata_time = metadata_return(metadata);
                    let created = cx.string(metadata_time[0].clone());
                    let accessed = cx.string(metadata_time[1].clone());
                    let modified = cx.string(metadata_time[2].clone());
                    k_crc32data.set(&mut cx, "created", created).unwrap();
                    k_crc32data.set(&mut cx, "accessed", accessed).unwrap();
                    k_crc32data.set(&mut cx, "modified", modified).unwrap();
                } else {
                    let metadata_time_should_be_activated =
                        cx.string("metadata time should be activated");
                    k_crc32data
                        .set(&mut cx, "created", metadata_time_should_be_activated)
                        .unwrap();
                    k_crc32data
                        .set(&mut cx, "accessed", metadata_time_should_be_activated)
                        .unwrap();
                    k_crc32data
                        .set(&mut cx, "modified", metadata_time_should_be_activated)
                        .unwrap();
                }

                deferred.resolve(&mut cx, k_crc32data);
            } else {
                let crc32 = cx.string(format!("{:x}", result[0]));
                deferred.resolve(&mut cx, crc32);
            }

            Ok(promise)
        }
    }
}

fn permissions_to_string(mode: u32) -> String {
    let mut result = String::new();
    for i in (0..9).rev() {
        let bit = (mode >> i) & 1;
        match i % 3 {
            2 => result.push(if bit == 1 { 'r' } else { '-' }),
            1 => result.push(if bit == 1 { 'w' } else { '-' }),
            0 => result.push(if bit == 1 { 'x' } else { '-' }),
            _ => unreachable!(),
        }
    }
    result
}

#[neon::main]
pub fn main(mut cx: ModuleContext) -> NeonResult<()> {
    cx.export_function("crc", crc)?;
    Ok(())
}
