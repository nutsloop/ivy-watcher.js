rm -rf ./bin || true
rm -rf ./lib || true
rm -rf ./node_modules || true
rm -rf ./types || true
rm -rf ./target || true
rm -rf ./compile || true
rm ./index.js || true
rm ./Cargo.lock || true
rm ./Cargo.toml || true
rm ./package-lock.json || true
ncu -u
npm install --ignore-scripts
npx tsc
chmod u+x ./bin/watcher.js || true
cp ./src/compile/Cargo.toml ./compile/Cargo.toml
cp ./compile/Cargo.toml ./Cargo.toml
cp -rf ./src/lib/rust/crc ./lib/rust/
npx cargo-cp-artifact -a cdylib \
  crc \
  lib/rust/crc.node \
  -- \
  cargo build --release \
  --message-format=json-render-diagnostics
