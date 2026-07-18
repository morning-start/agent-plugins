///|
/// FFI 声明 — {package_name}

///|
extern "c" fn {name}_version() -> Int = "{name}_version"

///|
extern "c" fn {name}_free(ptr: #owned Unit) -> Unit = "{name}_free"

///|
pub fn {name}_operation(input: Int) -> Int {
  // TODO: 实现安全包装
  input
}