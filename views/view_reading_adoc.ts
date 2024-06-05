import { App, FileView, WorkspaceLeaf, TFile, normalizePath } from 'obsidian';
import AsciiDoctor from 'asciidoctor';
import { dirname, resolve } from 'path';
// TODO: I'm also getting that thing again where a VM stays up because I failed to register something for deletion

const asciidoctor = AsciiDoctor();
const includeRegex = /include::([^\[]+)\[([^\]]*)\]/g;
interface IncludeParams {
    target: string;
    params?: string;
}


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
		try {
			return this.file!.basename;
		}
		catch (TypeError) {
			return "";
		}
	}

	// TODO: add an edit button & appropriate edit view
	async onLoadFile(file: TFile): Promise<void> {
		const { vault } = this.app;

		// Create body / content
		let data = await vault.read(file);
		let modifiedDataDoc = await this.postprocessAdoc(data);
		this.contentEl.addClass("adoc__read")
		this.contentEl.replaceChildren(modifiedDataDoc);
	}

	async onClose() {
        // nothin to do
	}

	async postprocessAdoc(element:string): Promise<HTMLElement> {
		// do a pre-pass on the html string to enable file transposition
		const transposedHtml = await this.processIncludes(element, this.file!.path);
		const html = asciidoctor.convert(transposedHtml, {standalone: false, safe: "UNSAFE"} ) as string;
		// create Document Fragments containing the html string
		const range = document.createRange();
		const fragmentsConverted = range.createContextualFragment(html.trim());
		// TODO: Also add an editable Title (mod-header class, if you're looking for it)
		// TODO: is this still needed with the transposition directive from earlier?
		const fragmentsRelinked:DocumentFragment = this.reassignAnchors(fragmentsConverted); 
		const divNestedRet:HTMLElement = this.buildNestedClassDivs(fragmentsRelinked);
		return divNestedRet;
	}
	
	// there are several divs within the "view-content" one that, far as I can tell, add a whole lot of CSS classes. This wraps those around a fragment. 
	buildNestedClassDivs(fragments:DocumentFragment): HTMLElement {
		// this is clearly not the most elegant way of doing things, but I'm not an elegant person
		const classesList = [
			[ "markdown-reading-view"],
			[ "markdown-preview-view", "markdown-rendered", "node-insert-event", "is-readable-line-width", "allow-fold-headings", "show-indentation-guide", "allow-fold-lists", "show-properties"],
			[ "markdown-preview-sizer", "markdown-preview-section"],
		  ];
	
		let outerDiv = document.createElement('div');
		let currentDiv = outerDiv;
	  
		classesList.forEach(classes => {
		  classes.forEach(className => currentDiv.classList.add(className));
		  const innerDiv = document.createElement('div');
		  currentDiv.appendChild(innerDiv);
		  currentDiv = innerDiv;
		});
	  
		currentDiv.appendChild(fragments);
		return outerDiv;
	}
	
	// file links returned by asciidoctor will point to a nonexistent place, this fixes that up
	reassignAnchors(fragments:DocumentFragment): DocumentFragment {
		// TODO
	
		return fragments;
	}
	
	// Function to parse the include parameters
	parseParams = (paramString: string): Record<string, string> => {
		const params: Record<string, string> = {};
		const paramPairs = paramString.split(',');
	
		paramPairs.forEach(pair => {
			const [key, value] = pair.split('=');
			if (key && value) {
				params[key.trim()] = value.trim();
			}
		});
	
		return params;
	};
	// to get recursive includes with absolute paths working (since obviously getAbstractFileByPath requires a full path for some fuckin reason)
	async processIncludes(html: string, currentFilePath: string): Promise<string> {
		// Define an async replace function to handle async operations inside the regex replace
		const asyncReplace = async (str: string, regex: RegExp, asyncFn: Function) => {
			const matches = [...str.matchAll(regex)];
			for (const match of matches) {
				const result = await asyncFn(...match, currentFilePath);
				str = str.replace(match[0], result);
			}
			return str;
		};
	
		// Perform the async replacement
		html = await asyncReplace(html, includeRegex, async (match: string, targetPath: string, paramString: string, currentFilePath: string) => {
			const { vault } = this.app;
	
			// Get the directory of the current file
			const currentFileDir = dirname(currentFilePath);
	
			// Resolve the target path relative to the current file's directory
			targetPath = resolve(currentFileDir, normalizePath(targetPath));
	
			// Parse the include parameters
			const params = this.parseParams(paramString);
			// TODO: Handle Params
	
			// Find the target file using the vault
			const target = this.app.vault.getAbstractFileByPath(targetPath) as TFile;
			// If the target is not found or not a file, return the original match
			if (!target || !(target instanceof TFile)) {
				console.error(`File not found: ${targetPath}`);
				return match;
			}
	
			// Read the content of the target file
			let includedContent: string;
			try {
				includedContent = await this.app.vault.read(target);
			} catch (error) {
				console.error(error);
				return match; // If file not found, leave the include directive as is
			}
	
			// Recursively process the included content
			return await this.processIncludes(includedContent, targetPath);
		});
	
		return html;
	}
	
}


