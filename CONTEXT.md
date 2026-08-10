# MarvellousSuspender

This context describes the user-facing tab suspension language for The Marvellous Suspender.

## Language

**Standalone App Window**:
A separate browser window that presents an installed or popup-style web app rather than an ordinary browser tab strip.
_Avoid_: PWA window

**Suspended Page**:
The extension-owned page shown in place of the original web page while its tab is suspended.
_Avoid_: Suspension Page, placeholder page

**Suspension Eligibility**:
The conditions that decide whether a tab may be suspended for a given request; Automatic Suspension and Explicit Suspension can have different eligibility.
_Avoid_: Suspension Policy

**Automatic Suspension**:
A suspension initiated by the extension or browser state, such as idle time or memory pressure, without a direct suspend command from the user.
_Avoid_: Timer suspension

**Explicit Suspension**:
A suspension initiated by a direct user command or external suspend request.
_Avoid_: Manual-only suspension
