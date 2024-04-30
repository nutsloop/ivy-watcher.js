import { createRequire } from 'module';

export type WatcherCRC<> = {
  accessed: number|string,
  crc32: string,
  created: number|string,
  data: Buffer| string,
  filename: string,
  index: string,
  mode: string,
  modified: number|string,
  path: string,
  size: number,
} & string;

interface IRust{
  crc( path: string, return_data?: boolean, return_content_buffer?: boolean, return_metadata_time?: boolean ): Promise<WatcherCRC>;
}

const rust_crc: IRust['crc'] = createRequire( import.meta.url )( './crc.node' ).crc;

export function crc( path: string, return_data?: boolean, return_content_buffer?: boolean, return_metadata_time?: boolean ): Promise<WatcherCRC>{
  return rust_crc( path, return_data, return_content_buffer, return_metadata_time );
}
