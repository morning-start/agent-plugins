///|
test "version" {
  let value = version()
  assert_true(value > 0)
}
