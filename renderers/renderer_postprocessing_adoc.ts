import AsciiDoctor from 'asciidoctor';
const asciidoctor = AsciiDoctor();

export async function postprocessAdoc(element:string): Promise<DocumentFragment>{
	// TODO: Figure out a way to do "include" statements properly here. Currently they're just, like,
	// <a href="settings.adoc" class="bare include">settings.adoc</a>
	// TODO: why are markdown files so much more padded than mine?
	let html = asciidoctor.convert(element, {standalone: false} ) as string;
    const range = document.createRange();
    return range.createContextualFragment(html.trim());
}