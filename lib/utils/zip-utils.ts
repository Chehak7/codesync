import JSZip from "jszip";

export async function JSZipExport(files: { name: string, code: string }[], filename: string) {
    const zip = new JSZip();

    files.forEach(file => {
        zip.file(file.name, file.code);
    });

    const content = await zip.generateAsync({ type: "blob" });
    const url = window.URL.createObjectURL(content);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    window.URL.revokeObjectURL(url);
}
