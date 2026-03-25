cask "antigravity-tools-ls" do
  version "0.0.2"
  sha256 :no_check

  name "Antigravity Tools LS"
  desc "Professional Account Management for AI Services"
  homepage "https://github.com/lbjlaq/Antigravity-Tools-LS"

  on_macos do
    url "https://github.com/lbjlaq/Antigravity-Tools-LS/releases/download/v#{version}/Antigravity-Tools-LS_#{version}_universal.dmg"

    app "Antigravity Tools LS.app"

    zap trash: [
      "~/Library/Application Support/com.lbjlaq.antigravity-tools-ls",
      "~/Library/Caches/com.lbjlaq.antigravity-tools-ls",
      "~/Library/Preferences/com.lbjlaq.antigravity-tools-ls.plist",
      "~/Library/Saved Application State/com.lbjlaq.antigravity-tools-ls.savedState",
    ]

    caveats <<~EOS
      If you encounter the "App is damaged" error, please run the following command:
        sudo xattr -rd com.apple.quarantine "/Applications/Antigravity Tools LS.app"

      Or install with the --no-quarantine flag:
        brew install --cask --no-quarantine antigravity-tools-ls
    EOS
  end

  on_linux do
    arch arm: "aarch64", intel: "amd64"

    url "https://github.com/lbjlaq/Antigravity-Tools-LS/releases/download/v#{version}/Antigravity-Tools-LS_#{version}_#{arch}.AppImage"
    binary "Antigravity-Tools-LS_#{version}_#{arch}.AppImage", target: "antigravity-tools-ls"

    preflight do
      system_command "/bin/chmod", args: ["+x", "#{staged_path}/Antigravity-Tools-LS_#{version}_#{arch}.AppImage"]
    end
  end
end
