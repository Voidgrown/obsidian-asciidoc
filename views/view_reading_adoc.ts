import { App, FileView, WorkspaceLeaf, TFile } from 'obsidian';
import { postprocessAdoc } from '../renderers/renderer_postprocessing_adoc'

export const VIEW_TYPE_ASCDOC_READ = "asciidoc-read-view";
export class AsciiDocViewRead extends FileView {

	constructor(leaf: WorkspaceLeaf) {
		super(leaf);
		this.file = this.app.workspace.getActiveFile();
	}

	getViewType() {
		return VIEW_TYPE_ASCDOC_READ;
	}

	getDisplayText() {
		return "AsciiDoc Reading View";
	}

	async onOpen() {
		let content = "Failed to read file while opening Read View!";
		if (this.file) {
			console.debug("onOpen found file {0}".format(this.file.name))
			content = await this.app.vault.read(this.file);
		}
		else {
			console.debug("onOpen found no file")
		}
		const html = postprocessAdoc(content);
		//this.containerEl.innerHTML = html;
		this.containerEl.createEl("html", html)
	}

	async onClose() {
        this.containerEl.detach();
	}
}
