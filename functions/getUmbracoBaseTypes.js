const getTypeBucket = () => ({
  BaseDocumentType: {
    name: "string",
    createDate: "string",
    updateDate: "string",
    route: "RouteType",
    id: "string",
    cultures: "CulturesType"
  },
  RouteType: {
    path: "string",
    startItem: {
      id: "string",
      path: "string"
    }
  },
  RichTextElementType: {
    tag: "string",
    text: "string",
    attributes: "{ [attributeName: string]: string }",
    elements: "Array<RichTextElementType>"
  },
  CulturesType: {
    "[lang: string]": "RouteType"
  },
  MultiUrlPickerSingleUrlType: {
    url: "string",
    title: "string",
    target: "string",
    destinationId: "string",
    destinationType: "string",
    route: "RouteType",
    linkType: "string"
  },
  PickedMediaType: {
    focalPoint: "PickedMediaFocalPointType | null",
    crops: "Array<PickedMediaCropType>",
    id: "string",
    name: "string",
    mediaType: "string",
    url: "string",
    extension: "string",
    width: "number",
    height: "number",
    bytes: "number",
    properties: "unknown"
  },
  PickedMediaFocalPointType: {
    left: "number",
    top: "number"
  },
  PickedMediaCropType: {
    alias: "string",
    width: "number",
    height: "number",
    coordinates: "PickedMediaCropCoordinatesType | null"
  },
  PickedMediaCropCoordinatesType: {
    x1: "number",
    y1: "number",
    x2: "number",
    y2: "number"
  }
});

module.exports = { getTypeBucket };