# MoonBit 项目类型检测（共享逻辑）

verify 技能使用此检测逻辑，避免代码漂移。

## 项目类型检测

```bash
# 检测项目类型：优先 pkgtype(kind: "executable") 新格式，兼容旧 "is-main": true
# 在主目录或子目录（cmd/main, src/main）中检测
MAIN_DETECTED=false
for f in moon.pkg cmd/main/moon.pkg src/main/moon.pkg; do
  if [ -f "$f" ]; then
    if grep -q 'pkgtype(kind: "executable")' "$f" 2>/dev/null; then
      MAIN_DETECTED=true; break
    fi
    if grep -q '"is-main": true' "$f" 2>/dev/null; then
      MAIN_DETECTED=true; break
    fi
  fi
done
PROJECT_TYPE=$([ "$MAIN_DETECTED" = true ] && echo "main" || echo "lib")
```

## 临时 Consumer 编译验证（lib 项目）

```bash
# 验证可被外部消费：创建临时 consumer 并导入
TMP_DIR=$(mktemp -d)
cat > "$TMP_DIR/moon.mod" << 'EOF'
name = "consumer_test"
EOF
mkdir -p "$TMP_DIR/src"
cat > "$TMP_DIR/src/moon.pkg" << 'EOF'
pkgtype(kind: "executable")
EOF
cat > "$TMP_DIR/src/main.mbt" << 'EOF'
fn main {
  println("consumer test")
}
EOF
moon work use -C "$TMP_DIR" "$(cd .. && pwd)"

# 编译 consumer 验证依赖可解析
(cd "$TMP_DIR" && moon check 2>&1) || fail("library cannot be consumed by external project")
rm -rf "$TMP_DIR"
```