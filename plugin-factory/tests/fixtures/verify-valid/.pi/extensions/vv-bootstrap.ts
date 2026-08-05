/**
 * vv — pi bootstrap extension (valid fixture).
 */

// @ts-check
/** @param {import("@earendil-works/pi-coding-agent").ExtensionAPI} pi */
export default function (pi) {
  pi.on("session_start", async (_event, ctx) => {
    ctx.ui.notify("verify-valid loaded", "info");
  });
}
