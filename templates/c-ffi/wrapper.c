#include <stdint.h>

int32_t {name}_version(void) {
  return 1;
}

void {name}_free(void *ptr) {
  (void)ptr;
}
