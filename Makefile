.PHONY: packages clean publish help

# Default target
help:
	@echo "Build peak packages..."
	@echo ""
	@echo "Available targets:"
	@echo "  clean     - Remove packages directory"
	@echo "  packages  - Build all packages from source"
	@echo "  publish   - Build and publish all packages"

# Clean and rebuild all packages
packages: clean
	@echo "Building packages..."
	mkdir -p packages/peak packages/ssr packages/vite-plugin
	
	@echo "Building @peak-js/peak..."
	cp index.js packages/peak/
	cp packages/_templates/peak.json packages/peak/package.json
	
	@echo "Building @peak-js/ssr..."
	cp -r ssr/* packages/ssr/
	cp packages/_templates/ssr.json packages/ssr/package.json
	
	@echo "Building @peak-js/vite-plugin..."
	cp vite-plugin/index.js packages/vite-plugin/
	cp packages/_templates/vite-plugin.json packages/vite-plugin/package.json
	
	@echo "done"

# Remove packages directory
clean:
	@echo "Cleaning packages directory..."
	rm -rf packages/peak packages/ssr packages/vite-plugin

# Publish all packages
publish: packages
	@echo "Publishing @peak-js/peak..."
	cd packages/peak && npm publish
	@echo "Publishing @peak-js/ssr..."
	cd packages/ssr && npm publish
	@echo "Publishing @peak-js/vite-plugin..."
	cd packages/vite-plugin && npm publish
	@echo "done"

# Development helpers
dev-link: packages
	@echo "Creating local npm links for development..."
	cd packages/peak && npm link
	cd packages/ssr && npm link
	cd packages/vite-plugin && npm link
	@echo "done"
