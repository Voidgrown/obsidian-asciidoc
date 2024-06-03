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

	//async onOpen() {
	async onLoadFile(file: TFile): Promise<void> {
		console.debug("onOpen found file {0}".format(this.file!.name))
		const { vault } = this.app;

		let data = await vault.read(file);
		let modifiedDataDoc = await postprocessAdoc(data);
		this.contentEl.addClass("adoc__read")
		this.contentEl.replaceChildren(modifiedDataDoc);
	}

	async onClose() {
        // nothin to do
	}
}
