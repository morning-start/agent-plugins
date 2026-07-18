///|
/// {package_name} — 测试

///|
test "hello" {
  inspect(hello(), content?="Hello from {package_name}!")?
}

///|
test "valid/simple/basic" {
  // TODO: 快乐路径测试
}

///|
test "invalid/error/bad-input" {
  // TODO: 错误路径测试
}

///|
test "edge/boundary" {
  // TODO: 边界情况测试
}