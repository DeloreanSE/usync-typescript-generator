# usync-typescript-generator
- [usync-typescript-generator](#usync-typescript-generator)
  - [What is this tool?](#what-is-this-tool)
  - [Why use this tool?](#why-use-this-tool)
  - [How to use.](#how-to-use)
  - [What does it generate?](#what-does-it-generate)
  - [Can it output types from my custom data types?](#can-it-output-types-from-my-custom-data-types)
  - [What built in data types are supported?](#what-built-in-data-types-are-supported)
  - [Is anything obvious missing?](#is-anything-obvious-missing)


## What is this tool?

It's a simple nodejs command line utility that can watch a folder of uSync config files and on detected changes regenerate a typescript definition file, with types built around the context of the **Content Delivery API** responses.

It was written according to response layout of Umbraco 13 RC: https://docs.umbraco.com/umbraco-cms/v/13.latest-rc/reference/content-delivery-api while using uSync version `12.2.2`.

This is what is does roughly:

- Creates a bucket (just a javascript object) of (soon to be) 'types'
- Add some default always included types to this bucket.
- Looks through your uSync config files, and adds new types accordingly.

It also supports compositions, which is extra nice.

## Why use this tool?

You are using Umbraco headless with the Content Delivery API and you also use uSync. The Delivery API lacks typing info on your document types but you want these types to be reflected all the way into your typescript frontend for easy component building or similar.

## How to use.

*Note: this is only tested on Node v20 but probably works on more versions.*

- Clone this repo to a folder
- Run `npm install`
- Run `node typegenerator.js`

This uses the default paths: `usyncPath` set to `/uSync/v9` and `output` set to `./output/content-delivery-api-types.ts`.

You can override these like so:

`node typegenerator.js -u ../umbraco/uSync/v9 -o ../frontend/types/mycooltypes.ts`

**It is recommended, if using Docker compose during local development, to run this in a node container and mount the needed paths accordingly.**

## What does it generate?

It depends on what types you have in your uSync setup. But there are some initial types always included:

```typescript
export type BaseDocumentType = {
  name: string;
  createDate: string;
  updateDate: string;
  route: RouteType;
  id: string;
  cultures: CulturesType;
}

export type RichTextElementType = {
  tag: string;
  text: string;
  attributes: { [attributeName: string]: string };
  elements: Array<RichTextElementType>;
}

export type PickedMediaType = {
  focalPoint: PickedMediaFocalPointType | null;
  crops: Array<PickedMediaCropType>;
  id: string;
  name: string;
  mediaType: string;
  url: string;
  extension: string;
  width: number;
  height: number;
  bytes: number;
  properties: unknown;
}

// And more..
```

Compositions becomes type intersects. Consider the above `BaseDocumentType`, and that you have your own `StartPage` and an SEO composition, then you could see these types built:

```typescript
export type SeoCompositionType = {
  properties: {
    forceNoIndex: boolean;
    hideFromXmlSitemap: boolean;
    seoDescription: string | null;
    seoTitle: string | null;
  }
}

export type ContentPageType = {
  contentType: "contentPage";
  properties: {
    fieldSpecificToContentpage: string | null;
    links: Array<MultiUrlPickerSingleUrlType>;
    relation: Array<DocumentType> | null;
  }
} & BaseDocumentType & SeoCompositionType

export type StartPageType = {
  contentType: "startPage";
  properties: {
    fieldSpecificToHomepage: string | null;
  }
} & BaseDocumentType & SeoCompositionType

export type DocumentType = ContentPageType | StartPageType 
```

## Can it output types from my custom data types?

Not out of the box, but if need be it shouldn't be too hard to modify this code to handle these as well. Check the `parseProperties` function, imitate and adapt.

## What built in data types are supported?

- `Umbraco.DateTime`
- `Umbraco.TextArea`
- `Umbraco.TextBox`
- `Umbraco.TinyMCE`
- `Umbraco.Integer`
- `Umbraco.Decimal`
- `Umbraco.RadioButtonList`
- `Umbraco.DropDown.Flexible`
- `Umbraco.TrueFalse`
- `Umbraco.RadioButtonList`
- `Umbraco.MultiUrlPicker`
- `Umbraco.MultiNodeTreePicker`
- `Umbraco.MediaPicker3`
- `Umbraco.BlockList`

## Is anything obvious missing?

Currently, it's lacking responses from the headless **Media Delivery API** in Umbraco, but we'll probably add this soon™.

No sophisticated support for possibly different (read: older) styles of uSync config files.