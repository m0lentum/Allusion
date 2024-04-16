{
  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/23.11";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, ... }@inputs: inputs.flake-utils.lib.eachDefaultSystem (system:
    let
      pkgs = import inputs.nixpkgs {
        inherit system;
      };
    in
    {
      packages.default = pkgs.stdenv.mkDerivation {
        inherit system;
        name = "allusion";
        src = ./.;

        offlineCache = pkgs.fetchYarnDeps {
          yarnLock = ./yarn.lock;
          hash = "sha256-fP9Rfa9oxbZAnOY/kkNW7TUTtXz++ovqy8JnZbFJ2pU=";
        };

        nativeBuildInputs = [
          pkgs.yarn
          pkgs.prefetch-yarn-deps
          pkgs.nodejs
          pkgs.electron
          pkgs.makeWrapper
        ];

        configurePhase = ''
          runHook preConfigure

          export HOME=$(mktemp -d)
          yarn config --offline set yarn-offline-mirror $offlineCache
          fixup-yarn-lock yarn.lock
          yarn install --offline --frozen-lockfile --ignore-platform --ignore-scripts --no-progress --non-interactive
          patchShebangs node_modules/

          runHook postConfigure
        '';

        buildPhase = ''
          runHook preBuild

          yarn --offline build
          yarn --offline electron-builder \
            --dir "--linux" "--x64" \
            -c.electronDist=${pkgs.electron}/libexec/electron \
            -c.electronVersion=${pkgs.electron.version}

          runHook postBuild
        '';

        installPhase = ''
          runHook preInstall

          mkdir -p $out/share/allusion
          cp dist/linux-unpacked/resources/app.asar $out/share/allusion/

          makeWrapper '${pkgs.electron}/bin/electron' "$out/bin/allusion" \
            --prefix PATH : ${pkgs.lib.makeBinPath [ pkgs.exiftool ]} \
            --add-flags "$out/share/allusion/app.asar" \
            --add-flags "\''${NIXOS_OZONE_WL:+\''${WAYLAND_DISPLAY:+--ozone-platform-hint=auto --enable-features=WaylandWindowDecorations}}"

          runHook postInstall
        '';
      };

      devShells.default = pkgs.mkShell {
        buildInputs = [
          pkgs.node2nix
          pkgs.yarn
          pkgs.electron
          pkgs.exiftool
        ];
      };
    });
}
