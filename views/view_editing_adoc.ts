import {
	ViewUpdate,
	PluginValue,
	EditorView,
	ViewPlugin,
  } from "@codemirror/view";

export class AsciiDocEditorPlugin implements PluginValue {

	// Editor in default markdown has class:
	// markdown-source-view cm-s-obsidian mod-cm6 node-insert-event is-readable-line-width is-live-preview is-folding show-properties
	// down to 
	// cm-contentContainer
	// see https://codemirror.net/docs/guide/#viewport

	constructor(view: EditorView) {
	// initializes the plugin

		// boilerplate copybaste
		//this.dom = view.dom.appendChild(document.createElement("div"))
		//this.dom.style.cssText =
		//  "position: absolute; inset-block-start: 2px; inset-inline-end: 5px"
		//this.dom.textContent = view.state.doc.length

	}

	update(update: ViewUpdate) {
	// updates your plugin when something has changed, for example when the user entered or selected some text.

		// boilerplate copybaste
		//if (update.docChanged)
		//	this.dom.textContent = update.state.doc.length

	}

	destroy() {
	// cleans up after the plugin
		
		// boilerplate copybaste
		//this.dom.remove()

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

