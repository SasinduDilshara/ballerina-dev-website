import React, { useState, createRef } from "react";
import { Container, Row, Col } from "react-bootstrap";
import DOMPurify from "dompurify";
import { copyToClipboard, extractOutput } from "../../../utils/bbe";
import Link from "next/link";

export const codeSnippetData = [
  `import ballerina/ai;
import ballerina/io;

// Documents of different types. The \`mimeType\` metadata identifies the type of each document.
final ai:TextDocument[] documents = [
    {
        metadata: {fileName: "leave_policy.md", mimeType: "text/markdown"},
        content: string \`# Leave policy

## Annual leave

Full-time employees are entitled to 20 days of paid annual leave per year.

## Sick leave

Employees are entitled to 10 days of paid sick leave per year.\`
    },
    {
        metadata: {fileName: "travel_policy.html", mimeType: "text/html"},
        content: string \`<h1>Travel policy</h1>
<h2>Booking</h2>
<p>Business travel must be booked two weeks in advance.</p>
<h2>Expenses</h2>
<p>Meals are reimbursed up to 60 USD per day.</p>\`
    },
    {
        metadata: {fileName: "code_of_conduct.txt", mimeType: "text/plain"},
        content: string \`Treat colleagues, customers, and partners with respect.
Harassment is not tolerated. Report any concerns to the HR team.\`
    }
];

// Select a chunker based on the MIME type of the document. Each chunker uses the
// structure of the document type (e.g., headers) to produce meaningful chunks and
// recursively falls back to smaller units (e.g., sentences) when a chunk is too large.
function getChunker(string? mimeType) returns ai:Chunker {
    match mimeType {
        "text/markdown" => {
            return new ai:MarkdownChunker(maxChunkSize = 100, maxOverlapSize = 20);
        }
        "text/html" => {
            return new ai:HtmlChunker(maxChunkSize = 100, maxOverlapSize = 20);
        }
        _ => {
            return new ai:GenericRecursiveChunker(maxChunkSize = 100, maxOverlapSize = 20,
                    strategy = ai:SENTENCE);
        }
    }
}

public function main() returns error? {
    foreach ai:TextDocument document in documents {
        ai:Chunker chunker = getChunker(document.metadata?.mimeType);
        ai:Chunk[] chunks = check chunker.chunk(document);
        io:println(string \`\${document.metadata?.fileName ?: ""} (\${document.metadata?.mimeType ?: ""}): \${
                chunks.length()} chunks\`);
        foreach ai:Chunk chunk in chunks {
            // Chunks carry metadata such as the chunk index and the section header.
            string content = re \`\\s+\`.replaceAll(chunk.content.toString(), " ").trim();
            io:println(string \`  [\${chunk.metadata?.index ?: 0}] header: \${chunk.metadata?.header ?: "-"} | \${
                    content}\`);
        }
    }
}
`,
];

export function RagDocumentChunking({ codeSnippets }) {
  const [codeClick1, updateCodeClick1] = useState(false);

  const [outputClick1, updateOutputClick1] = useState(false);
  const ref1 = createRef();

  const [btnHover, updateBtnHover] = useState([false, false]);

  return (
    <Container className="bbeBody d-flex flex-column h-100">
      <h1>Document chunking for retrieval-augmented generation (RAG)</h1>

      <p>
        Documents are split into smaller chunks before they are embedded and
        indexed for retrieval-augmented generation (RAG). The{" "}
        <code>ai:Chunker</code> abstraction has implementations for Markdown (
        <code>ai:MarkdownChunker</code>), HTML (<code>ai:HtmlChunker</code>),
        and generic text (<code>ai:GenericRecursiveChunker</code>) documents.
        Each chunker uses the structure of the document type to produce
        meaningful chunks and recursively falls back to smaller units when a
        chunk exceeds the maximum size.
      </p>

      <p>
        This example demonstrates how to select a chunker based on the MIME type
        of a document and chunk documents of different types. When documents are
        ingested into an <code>ai:VectorKnowledgeBase</code>, chunking is
        handled automatically based on the document type.
      </p>

      <p>
        For more information on the underlying module, see the{" "}
        <a href="https://lib.ballerina.io/ballerina/ai/latest/">
          <code>ballerina/ai</code> module
        </a>
        .
      </p>

      <Row
        className="bbeCode mx-0 py-0 rounded 
      "
        style={{ marginLeft: "0px" }}
      >
        <Col className="d-flex align-items-start" sm={12}>
          {codeClick1 ? (
            <button
              className="bg-transparent border-0 m-0 p-2  ms-auto"
              disabled
              aria-label="Copy to Clipboard Check"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                fill="#20b6b0"
                className="bi bi-check"
                viewBox="0 0 16 16"
              >
                <title>Copied</title>
                <path d="M10.97 4.97a.75.75 0 0 1 1.07 1.05l-3.99 4.99a.75.75 0 0 1-1.08.02L4.324 8.384a.75.75 0 1 1 1.06-1.06l2.094 2.093 3.473-4.425a.267.267 0 0 1 .02-.022z" />
              </svg>
            </button>
          ) : (
            <button
              className="bg-transparent border-0 m-0 p-2  ms-auto"
              onClick={() => {
                updateCodeClick1(true);
                copyToClipboard(codeSnippetData[0]);
                setTimeout(() => {
                  updateCodeClick1(false);
                }, 3000);
              }}
              aria-label="Copy to Clipboard"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                fill="#000"
                className="bi bi-clipboard"
                viewBox="0 0 16 16"
              >
                <title>Copy to Clipboard</title>
                <path d="M4 1.5H3a2 2 0 0 0-2 2V14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3.5a2 2 0 0 0-2-2h-1v1h1a1 1 0 0 1 1 1V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1h1v-1z" />
                <path d="M9.5 1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5h3zm-3-1A1.5 1.5 0 0 0 5 1.5v1A1.5 1.5 0 0 0 6.5 4h3A1.5 1.5 0 0 0 11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3z" />
              </svg>
            </button>
          )}
        </Col>
        <Col sm={12}>
          {codeSnippets[0] != undefined && (
            <div
              dangerouslySetInnerHTML={{
                __html: DOMPurify.sanitize(codeSnippets[0]),
              }}
            />
          )}
        </Col>
      </Row>

      <Row
        className="bbeOutput mx-0 py-0 rounded "
        style={{ marginLeft: "0px" }}
      >
        <Col sm={12} className="d-flex align-items-start">
          {outputClick1 ? (
            <button
              className="bg-transparent border-0 m-0 p-2 ms-auto"
              aria-label="Copy to Clipboard Check"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                fill="#20b6b0"
                className="output-btn bi bi-check"
                viewBox="0 0 16 16"
              >
                <title>Copied</title>
                <path d="M10.97 4.97a.75.75 0 0 1 1.07 1.05l-3.99 4.99a.75.75 0 0 1-1.08.02L4.324 8.384a.75.75 0 1 1 1.06-1.06l2.094 2.093 3.473-4.425a.267.267 0 0 1 .02-.022z" />
              </svg>
            </button>
          ) : (
            <button
              className="bg-transparent border-0 m-0 p-2 ms-auto"
              onClick={() => {
                updateOutputClick1(true);
                const extractedText = extractOutput(ref1.current.innerText);
                copyToClipboard(extractedText);
                setTimeout(() => {
                  updateOutputClick1(false);
                }, 3000);
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                fill="#EEEEEE"
                className="output-btn bi bi-clipboard"
                viewBox="0 0 16 16"
                aria-label="Copy to Clipboard"
              >
                <title>Copy to Clipboard</title>
                <path d="M4 1.5H3a2 2 0 0 0-2 2V14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3.5a2 2 0 0 0-2-2h-1v1h1a1 1 0 0 1 1 1V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1h1v-1z" />
                <path d="M9.5 1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5h3zm-3-1A1.5 1.5 0 0 0 5 1.5v1A1.5 1.5 0 0 0 6.5 4h3A1.5 1.5 0 0 0 11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3z" />
              </svg>
            </button>
          )}
        </Col>
        <Col sm={12}>
          <pre ref={ref1}>
            <code className="d-flex flex-column">
              <span>{`\$ bal run rag_document_chunking.bal`}</span>
              <span>{`leave_policy.md (text/markdown): 3 chunks`}</span>
              <span>{`  [0] header: - | # Leave policy ## Annual leave`}</span>
              <span>{`  [1] header: Annual leave | ## Annual leave Full-time employees are entitled to 20 days of paid annual leave per year.`}</span>
              <span>{`  [2] header: Sick leave | ## Sick leave Employees are entitled to 10 days of paid sick leave per year.`}</span>
              <span>{`travel_policy.html (text/html): 2 chunks`}</span>
              <span>{`  [0] header: - | <h1>Travel policy</h1> <h2>Booking</h2> <p>Business travel must be booked two weeks in advance.</p>`}</span>
              <span>{`  [1] header: Expenses | <h2>Expenses</h2> <p>Meals are reimbursed up to 60 USD per day.</p>`}</span>
              <span>{`code_of_conduct.txt (text/plain): 2 chunks`}</span>
              <span>{`  [0] header: - | Treat colleagues, customers, and partners with respect. Harassment is not tolerated.`}</span>
              <span>{`  [1] header: - | Report any concerns to the HR team.`}</span>
            </code>
          </pre>
        </Col>
      </Row>

      <h2>Related links</h2>

      <ul style={{ marginLeft: "0px" }} class="relatedLinks">
        <li>
          <span>&#8226;&nbsp;</span>
          <span>
            <a href="/learn/by-example/rag-document-loading/">
              The Document loading example
            </a>
          </span>
        </li>
      </ul>
      <ul style={{ marginLeft: "0px" }} class="relatedLinks">
        <li>
          <span>&#8226;&nbsp;</span>
          <span>
            <a href="/learn/by-example/rag-ingestion-with-external-vector-store/">
              The RAG ingestion with external vector store example
            </a>
          </span>
        </li>
      </ul>
      <ul style={{ marginLeft: "0px" }} class="relatedLinks">
        <li>
          <span>&#8226;&nbsp;</span>
          <span>
            <a href="/learn/by-example/rag-query-with-metadata-filters/">
              The Vector search with metadata filters example
            </a>
          </span>
        </li>
      </ul>
      <span style={{ marginBottom: "20px" }}></span>

      <Row className="mt-auto mb-5">
        <Col sm={6}>
          <Link
            title="Document loading"
            href="/learn/by-example/rag-document-loading/"
          >
            <div className="btnContainer d-flex align-items-center me-auto">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                fill="#3ad1ca"
                className={`${
                  btnHover[0] ? "btnArrowHover" : "btnArrow"
                } bi bi-arrow-right`}
                viewBox="0 0 16 16"
                onMouseEnter={() => updateBtnHover([true, false])}
                onMouseOut={() => updateBtnHover([false, false])}
              >
                <path
                  fill-rule="evenodd"
                  d="M15 8a.5.5 0 0 0-.5-.5H2.707l3.147-3.146a.5.5 0 1 0-.708-.708l-4 4a.5.5 0 0 0 0 .708l4 4a.5.5 0 0 0 .708-.708L2.707 8.5H14.5A.5.5 0 0 0 15 8z"
                />
              </svg>
              <div className="d-flex flex-column ms-4">
                <span className="btnPrev">Previous</span>
                <span
                  className={btnHover[0] ? "btnTitleHover" : "btnTitle"}
                  onMouseEnter={() => updateBtnHover([true, false])}
                  onMouseOut={() => updateBtnHover([false, false])}
                >
                  Document loading
                </span>
              </div>
            </div>
          </Link>
        </Col>
        <Col sm={6}>
          <Link
            title="Embeddings with a specific embedding provider"
            href="/learn/by-example/rag-embedding-provider/"
          >
            <div className="btnContainer d-flex align-items-center ms-auto">
              <div className="d-flex flex-column me-4">
                <span className="btnNext">Next</span>
                <span
                  className={btnHover[1] ? "btnTitleHover" : "btnTitle"}
                  onMouseEnter={() => updateBtnHover([false, true])}
                  onMouseOut={() => updateBtnHover([false, false])}
                >
                  Embeddings with a specific embedding provider
                </span>
              </div>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                fill="#3ad1ca"
                className={`${
                  btnHover[1] ? "btnArrowHover" : "btnArrow"
                } bi bi-arrow-right`}
                viewBox="0 0 16 16"
                onMouseEnter={() => updateBtnHover([false, true])}
                onMouseOut={() => updateBtnHover([false, false])}
              >
                <path
                  fill-rule="evenodd"
                  d="M1 8a.5.5 0 0 1 .5-.5h11.793l-3.147-3.146a.5.5 0 0 1 .708-.708l4 4a.5.5 0 0 1 0 .708l-4 4a.5.5 0 0 1-.708-.708L13.293 8.5H1.5A.5.5 0 0 1 1 8z"
                />
              </svg>
            </div>
          </Link>
        </Col>
      </Row>
    </Container>
  );
}
