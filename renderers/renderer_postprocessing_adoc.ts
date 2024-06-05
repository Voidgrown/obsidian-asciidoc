import AsciiDoctor from 'asciidoctor';
const asciidoctor = AsciiDoctor();

export async function postprocessAdoc(element:string): Promise<HTMLElement>{
	// TODO: Figure out a way to do "include" statements properly here. Currently they're just, like,
	// <a href="settings.adoc" class="bare include">settings.adoc</a>
	let html = asciidoctor.convert(element, {standalone: false} ) as string;
    const range = document.createRange();
    const fragmentsDivless = range.createContextualFragment(html.trim());
	const ret:HTMLElement = buildNestedDivs(fragmentsDivless);
	return ret
}

// there are several divs within the "view-content" one that, far as I can tell, add a whole lot of CSS classes. This wraps those around a fragment. 
function buildNestedDivs(fragment:DocumentFragment): HTMLElement {
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
  
	currentDiv.appendChild(fragment);
	return outerDiv;
}
