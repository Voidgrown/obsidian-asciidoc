import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting, ItemView, WorkspaceLeaf, MarkdownRenderer, MarkdownPostProcessorContext } from 'obsidian';


export const VIEW_TYPE_ASCDOC_EDIT = "asciidoc-edit-view";
export class AsciiDocViewEdit extends ItemView {
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
		container.createEl("h4", { text: "AsciiDoc Edit View" });
	}

	async onClose() {
		// Nothing to clean up.
	}

	async activateView() {
		const { workspace } = this.app;

		let leaf: WorkspaceLeaf | null = null;
		const leaves = workspace.getLeavesOfType(VIEW_TYPE_EXAMPLE);

		if (leaves.length > 0) {
		  // A leaf with our view already exists, use that
		  leaf = leaves[0];
		} else {
		  // Our view could not be found in the workspace, create a new leaf
		  // in the right sidebar for it
		  leaf = workspace.getRightLeaf(false);
		  await leaf.setViewState({ type: VIEW_TYPE_EXAMPLE, active: true });
		}

		// "Reveal" the leaf in case it is in a collapsed sidebar
		workspace.revealLeaf(leaf);
  }
}

