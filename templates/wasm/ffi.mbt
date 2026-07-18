///|
/// WASM FFI 声明 — {package_name}
///
/// L0: 内联 WASM 指令（最小层，< 100 行）
/// 遵循 4 层 FFI 架构: L0 → L1 Raw → L2 Public → L3 Traits

///|
/// 存储 32 位值到内存地址
extern "wasm" fn store32(ptr: Int, value: Int) -> Unit = "i32.store"

///|
/// 从内存地址加载 32 位值
extern "wasm" fn load32(ptr: Int) -> Int = "i32.load"

///|
/// 分配内存（通过 Bytes::make）
pub fn malloc(size: Int) -> Int {
  let bytes = Bytes::make(size, b'\x00')
  bytes2ptr(bytes)
}

///|
/// 释放内存
pub fn free(ptr: Int) -> Unit {
  let bytes = ptr2bytes(ptr)
  moonbit.decref(bytes)
}

///|
/// Bytes → 内存指针
pub fn bytes2ptr(bytes: Bytes) -> Int = "#bytes.to_ptr"