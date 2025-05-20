import Document, { Html, Head, Main, NextScript } from "next/document";

export default class MyDocument extends Document {
  static async getInitialProps(ctx) {
    const initialProps = await Document.getInitialProps(ctx);

    // Get the nonce from the request headers (set in your middleware)
    const nonce = ctx.req?.headers["x-nonce"] || "";

    return {
      ...initialProps,
      nonce,
    };
  }

  render() {
    const nonce = this.props.nonce;

    return (
      <Html>
        <Head>
          {/* If you have any inline styles here, apply nonce */}
          {/* Example: */}
          {/* <style nonce={nonce}>{`body { margin: 0 }`}</style> */}
        </Head>
        <body>
          <Main />
          <NextScript nonce={nonce} />
        </body>
      </Html>
    );
  }
}
