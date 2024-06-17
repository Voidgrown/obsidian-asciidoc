import { App, FileView, WorkspaceLeaf, TFile, normalizePath } from 'obsidian';
import AsciiDoctor from 'asciidoctor';
import { join, dirname, basename } from 'path';

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
		const divNestedRet = document.createElement('div');
		const divsTitle:DocumentFragment = this.buildTitleDivs(fragmentsConverted, this.file!);
		const divsContent:DocumentFragment = this.buildNestedClassDivs(divsTitle);
		divNestedRet.appendChild(divsContent);
		// TODO: Also add an editable Title (mod-header class, if you're looking for it)
		return divNestedRet;
	}

	async postprocessAdoc(element:string): Promise<string> {
		// do a pre-pass on the html string to enable file transposition
		let transposedHtml = await this.processIncludes(await this.app.vault.read(this.file!), this.file!.path);
		let html = asciidoctor.convert(transposedHtml, {standalone: false, safe: "UNSAFE"} ) as string;
		return html;
	}
	
	// there are several divs within the "view-content" one that, far as I can tell, add a whole lot of CSS classes. This wraps those around a fragment. 
	buildNestedClassDivs(fragments: DocumentFragment): DocumentFragment {
		// Create a new DocumentFragment
		const docFragment = document.createDocumentFragment();
		
		// Define the list of class names for each nested div
		const classesList = [
			["markdown-reading-view"],
			[
				"markdown-preview-view", "markdown-rendered", "node-insert-event", 
				"is-readable-line-width", "allow-fold-headings", 
				"show-indentation-guide", "allow-fold-lists", "show-properties"
			],
			["markdown-preview-sizer", "markdown-preview-section"],
		];
		
		// Create the outermost div
		let outerDiv = document.createElement('div');
		let currentDiv = outerDiv;
		
		// Loop through the classesList to add classes and create nested divs
		classesList.forEach(classes => {
			classes.forEach(className => currentDiv.classList.add(className));
			const innerDiv = document.createElement('div');
			currentDiv.appendChild(innerDiv);
			currentDiv = innerDiv;
		});
		
		// Append the passed fragments to the innermost div
		currentDiv.appendChild(fragments);
		// Append the outermost div to the DocumentFragment
		docFragment.appendChild(outerDiv);
		// Return the DocumentFragment
		return docFragment;
	}

	buildTitleDivs(fragments: DocumentFragment, file: TFile): DocumentFragment {
		// Create a new DocumentFragment
		const docFragment = document.createDocumentFragment();
		
		// Create the outer div with class "mod-header"
		const modHeaderDiv = document.createElement('div');
		modHeaderDiv.classList.add('mod-header');
		
		// Create the inner div with the specified attributes and classes
		const inlineTitleDiv = document.createElement('div');
		inlineTitleDiv.classList.add('inline-title');
		inlineTitleDiv.setAttribute('contenteditable', 'true');
		inlineTitleDiv.setAttribute('autocapitalize', 'on');
		inlineTitleDiv.setAttribute('tabindex', '-1');
		inlineTitleDiv.setAttribute('enterkeyhint', 'done');
		inlineTitleDiv.textContent = this.file!.basename;
		
		// Append the inner div to the outer div
		modHeaderDiv.appendChild(inlineTitleDiv);
		// Append the outer div to the DocumentFragment
		docFragment.appendChild(modHeaderDiv);
		// Append the original fragments to the DocumentFragment
		docFragment.appendChild(fragments);
	
		// Add an event listener to handle renaming the file when "Enter" is pressed
		inlineTitleDiv.addEventListener('keydown', async (event) => {
			if (event.key === 'Enter') {
				event.preventDefault();
				const newTitle = inlineTitleDiv.textContent;
				if (newTitle && newTitle !== file.basename) {
					const fileExtension = file.extension;
					const newPath = file.path.replace(/[^/]*$/, newTitle + '.' + fileExtension);
					await this.app.fileManager.renameFile(file, newPath);
				}
				inlineTitleDiv.blur(); // Remove focus from the title div
			}
		});
		
		// Return the DocumentFragment
		return docFragment;
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
				includedFilePath = normalizePath(includedFilePath);
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

				workingFileContents = this.resolveImagesAsResourcePaths(workingFileContents, dirname(relativeFilePath))

				// replace the match with the file contents of its referate recursively
				workingFileContents = workingFileContents.replace(
					match[0],
					await this.processIncludes(subFileContent, includedFilePath)
				);
			}
		}
		return workingFileContents;
	}

	// It's inherently impossible here to correctly handle image paths without writing a settings handler from scratch, 
	// so this searches the vault if it doesn't find anything
	resolveImagesAsResourcePaths(adocFileContent: string, relativeFilePath: string): string {
		const imageRegex = /(image::?)([^\[]+)(\[.*?\])/g;
		adocFileContent = this.resolveFilesAsResourcePath(adocFileContent, relativeFilePath, imageRegex, 2);
		return adocFileContent;
	}

	resolveFilesAsResourcePath(
		adocFileContent: string, 
		// path of whatever file is being processed at that moment (not to be confused with the active file)
		relativeFilePath: string, 
		// expression matching against what you want to resolve as a resource path, e.g. `/(image::?)([^\[]+)(\[.*?\])/g`
		regex: RegExp,
		// which capturing group to replace with a resource link
		positionToReplace: number,
	): string {
		const matches = [...adocFileContent.matchAll(regex)];
		matches.forEach(match => {
			let vaultAbsPath:string;
			if(match[positionToReplace].startsWith('.')){
				vaultAbsPath = normalizePath(join(relativeFilePath, match[positionToReplace])); 
			}
			else {
				vaultAbsPath = normalizePath(match[2]); 
			}
			let file = this.app.vault.getFileByPath(vaultAbsPath);
			if (!file){
				let allFiles = this.app.vault.getFiles();
				allFiles.forEach(vaultFile => {
					if (vaultFile.name == basename(vaultAbsPath)) {
						file = vaultFile;
					}
				});
			}
			let resourcePath:string = vaultAbsPath;
			if (file) {
				resourcePath = this.app.vault.getResourcePath(file);
			}
			let fullReplacement = "";
			match.forEach((matchingGroup, index) => {
				if (index === 0) {
					return; // Skip the first element, since it's the full match
				}
				if (matchingGroup != match[positionToReplace]) {
					fullReplacement += matchingGroup;
				} else {
					fullReplacement += resourcePath;
				}
			});
			
			fullReplacement = match[1]+resourcePath+match[3]
			adocFileContent = adocFileContent.replace(match[0], fullReplacement);
		});
		return adocFileContent;
	}
}


