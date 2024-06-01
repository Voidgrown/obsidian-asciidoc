import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting, EditableFileView, WorkspaceLeaf, MarkdownRenderer, MarkdownPostProcessorContext } from 'obsidian';


export const VIEW_TYPE_ASCDOC_EDIT = "asciidoc-edit-view";
export class AsciiDocViewEdit extends EditableFileView {
	constructor(leaf: WorkspaceLeaf) {
		super(leaf);
		// Initialize your view here
	}

	getViewType() {
		return VIEW_TYPE_ASCDOC_EDIT;
	}

	getDisplayText() {
		return "AsciiDoc Edit View";
	}

	async onOpen() {
		const container = this.containerEl.children[1];
		container.empty();
		container.createEl("h1", { text: "AsciiDoc Edit View" });
	}

	async onClose() {
		// Nothing to clean up.
	}

}

