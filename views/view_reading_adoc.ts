import { App, FileView, WorkspaceLeaf, TFile, normalizePath } from 'obsidian';
import AsciiDoctor from 'asciidoctor';
import { join, dirname } from 'path';
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
		let nestedHtml = await this.nestProcessedAdoc(modifiedDataDoc)
		this.contentEl.addClass("adoc__read")
		this.contentEl.replaceChildren(nestedHtml);
	}

	async onClose() {
        // nothin to do
	}

	async nestProcessedAdoc(adocHtml:string): Promise<HTMLElement> {
		// create Document Fragments containing the html string
		const range = document.createRange();
		const fragmentsConverted = range.createContextualFragment(adocHtml.trim());
		const divNestedRet:HTMLElement = this.buildNestedClassDivs(fragmentsConverted);
		// TODO: Also add an editable Title (mod-header class, if you're looking for it)
		return divNestedRet;
	}

	async postprocessAdoc(element:string): Promise<string> {
		// do a pre-pass on the html string to enable file transposition
		let transposedHtml = await this.processIncludes(await this.app.vault.read(this.file!), this.file!.path);
		let html = asciidoctor.convert(transposedHtml, {standalone: false, safe: "UNSAFE"} ) as string;
		// TODO: this function should make images viable, but it just... isn't working right now
		// html = this.spanifyImages(html); 
		return html;
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
	async processIncludes(workingFileContents:string, relativeFilePath:string) :Promise<string> {
		const { vault } = this.app;
		const matches = [...workingFileContents.matchAll(includeRegex)];
		if (matches.length > 0) {
			for (const match of matches) {
				let includeParams:IncludeParams = {
					target: match[1],   // First capturing group ([^\[]+)
					params: match[2]    // Second capturing group ([^\]]*)
				};
				// TODO: Handle Params
				let params = includeParams.params ? this.parseParams(includeParams.params) : null;
				let includedFilePath = join(dirname(relativeFilePath), includeParams.target);
				// path.join returns backslashes on windows for some reason, and obsidian can't read those
				includedFilePath = includedFilePath.replace(/\\/g,"/");
				// read out contents of the file referenced in the match
				let referencedFile:TFile|null;
				let subFileContent:string;
				try {
					referencedFile = vault.getFileByPath(includedFilePath)!;
					subFileContent = await vault.read(referencedFile);
				}
				catch (TypeError){
					referencedFile = null;
					subFileContent = `Could not find file '${includedFilePath}'\n`;
				}
				// replace the match with the file contents of its referate recursively
				workingFileContents = workingFileContents.replace(
					match[0],
					await this.processIncludes(subFileContent, includedFilePath)
				);
			}
		}
		return workingFileContents;
	}

	spanifyImages(html: string): string {
		// Regular expression to match <img> tags with attributes
		const imgTagRegex = /<img\b([^>]*)>/gi;
	
		// Function to replace <img> with <span>
		const replaceFunction = (match: string, attributes: string) => {
			// Extracting src attribute from img tag
			const srcMatch = /src\s*=\s*"([^"]*)"/i.exec(attributes);
			const srcAttribute = srcMatch ? `data-src="${srcMatch[1]}"` : '';
			return `<span class="internal-embed media-embed image-embed is-loaded" ${srcAttribute}></span>`;
		};
	
		// Replace all <img> tags in the input HTML string
		return html.replace(imgTagRegex, replaceFunction);
	}
}


