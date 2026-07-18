///|
/// {package_name} — CLI 入口
/// 使用 @argparse 解析命令行参数

fn main {
  let args = @argparse.parse_or_exit(
    @argparse.new("my-cli")
      |> @argparse.add_opt("--name", "Your name")
      |> @argparse.add_opt("--verbose", "Enable verbose output", short~='v'),
  )
  let name = args.get_opt("--name").or("World")
  println("Hello, \{name}!")
}