import { defineConfig } from "jsrepo";
import prettier from "@jsrepo/transform-prettier";
    
export default defineConfig({
	registries: [
	"@ieedan/shadcn-svelte-extras"
],
	paths: {
	"*": '$lib/blocks',
	"ui": '$lib/components/ui',
	"hooks": '$lib/hooks',
	"actions": '$lib/actions',
	"utils": '$lib',
		lib: 'src/lib/blocks',
		hook: 'src/lib/blocks'
},
	transforms: [prettier()],
});