///|
/// {package_name} — WASM 测试

///|
test "memory operations" {
  let ptr = malloc(1024)
  store32(ptr, 42)
  inspect(load32(ptr), content?="42")?
  free(ptr)
}