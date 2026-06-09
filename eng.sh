 info "Installing pre-built Linux binary..."
      ENGRAM_BIN_DIR="$HOME/.local/bin"
      mkdir -p "$ENGRAM_BIN_DIR"
      ENGRAM_LATEST=$(curl -s https://api.github.com/repos/Gentleman-Programming/engram/releases/latest \
        | python3 -c "import sys,json; r=json.load(sys.stdin); print(r['tag_name'])" 2>/dev/null || echo "v1.15.13")
      ENGRAM_URL="https://github.com/Gentleman-Programming/engram/releases/download/${ENGRAM_LATEST}/engram_Linux_x86_6>
      info "Downloading $ENGRAM_LATEST..."
      curl -sL "$ENGRAM_URL" | tar -xz -C "$ENGRAM_BIN_DIR" engram
      chmod +x "$ENGRAM_BIN_DIR/engram"
      # Add to PATH for this session
      export PATH="$ENGRAM_BIN_DIR:$PATH"
      if command -v engram &>/dev/null; then
        ENGRAM_INSTALLED=true
        success "Engram installed at $ENGRAM_BIN_DIR/engram"
        warn "Add to your shell profile: export PATH=\"\$HOME/.local/bin:\$PATH\""
      else
        warn "Binary downloaded but not in PATH. Add $ENGRAM_BIN_DIR to your PATH."
      fi
