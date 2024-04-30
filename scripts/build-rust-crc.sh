npx tsc
chmod u+x ./bin/watcher.js || true
rm -rf ./target || true
rm -rf ./src/lib/rust/crc/target || true
cp ./src/compile/Cargo.toml ./compile/Cargo.toml
cp ./compile/Cargo.toml ./Cargo.toml
cp -r ./src/lib/rust/crc ./lib/rust/crc
npx cargo-cp-artifact -a cdylib \
  crc \
  lib/rust/crc.node \
  -- \
  cargo build --release \
  --message-format=json-render-diagnostics
