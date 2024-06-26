import {
	ViewUpdate,
	PluginValue,
	EditorView,
	ViewPlugin,
  } from "@codemirror/view";

class AsciiDocEditorPlugin implements PluginValue {
	constructor(view: EditorView) {
	// initializes the plugin
	}

	update(update: ViewUpdate) {
	// updates your plugin when something has changed, for example when the user entered or selected some text.
	}

	destroy() {
	// cleans up after the plugin
	}
}

export const examplePlugin = ViewPlugin.fromClass(AsciiDocEditorPlugin);


// TODO: Let's see if this is still needed once I've implemented a basic view plugin
//export const VIEW_TYPE_ASCDOC_EDIT = "asciidoc-edit-view";
//export class AsciiDocViewEdit extends EditableFileView {
//	constructor(leaf: WorkspaceLeaf) {
//		super(leaf);
//		// Initialize your view here
//	}
//
//	getViewType() {
//		return VIEW_TYPE_ASCDOC_EDIT;
//	}
//
//	getDisplayText() {
//		return "AsciiDoc Edit View";
//	}
//
//	async onOpen() {
//		const container = this.containerEl.children[1];
//		container.empty();
//		container.createEl("h1", { text: "AsciiDoc Edit View" });
//	}
//
//	async onClose() {
//		// Nothing to clean up.
//	}
//
//}

