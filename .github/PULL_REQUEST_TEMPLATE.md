### Description
_Clear and concise description of what this PR does._


### Versioning
- [ ] Update version number in `extension.yaml` (semantic versioning: MAJOR.MINOR.PATCH).
- [ ] Add new entry in `CHANGELOG.md` with date and categorized changes.

### Documentation
- [ ] Verify `README.md` covers description, features, billing and other relevant information.
- [ ] Verify `PREINSTALL.md` covers requirement changes as required.
- [ ] Verify `POSTINSTALL.md` covers usage, monitoring, and next steps as required.

### Code Quality
- [ ] Ensure all parameters are defined in `extension.yaml` and referenced in code (no hardcoded values).
- [ ] Verify structured logging (`functions.logger`) is used consistently.

### Testing
- [ ] Run Firebase Emulator Suite locally to test triggers.
- [ ] Confirm idempotent behavior (safe retries, no duplicate writes).
- [ ] Check event logs are written correctly to subcollections.