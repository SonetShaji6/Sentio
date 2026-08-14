declare module "pdfkit" {
  const PDFDocument: any;
  export default PDFDocument;
}

declare module "officeparser" {
  export function parseOffice(file: any, callback?: any): any;
  export function parseOfficeAsync(file: any, config?: any): Promise<any>;
}
