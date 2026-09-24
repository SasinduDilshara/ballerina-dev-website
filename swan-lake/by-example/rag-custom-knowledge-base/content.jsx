import React, { useState, createRef } from "react";
import { Container, Row, Col } from "react-bootstrap";
import DOMPurify from "dompurify";
import { copyToClipboard, extractOutput } from "../../../utils/bbe";
import Link from "next/link";

export const codeSnippetData = [
  `import ballerina/ai;
import ballerina/io;

// A custom knowledge base that implements the \`ai:KnowledgeBase\` type.
// Instead of vector similarity, this implementation ranks chunks by keyword overlap.
// The same approach can be used to integrate any search backend (e.g., a full-text
// search engine or an existing enterprise search API) into a RAG workflow.
isolated class KeywordKnowledgeBase {
    *ai:KnowledgeBase;

    private final ai:TextChunk[] chunks = [];

    // Ingests documents or chunks. Documents are split into paragraphs here;
    // an \`ai:Chunker\` can be used instead for finer control.
    public isolated function ingest(ai:Chunk[]|ai:Document[]|ai:Document documents) returns ai:Error? {
        ai:Document[] items;
        if documents is ai:Document {
            items = [documents];
        } else {
            items = documents;
        }
        foreach ai:Document item in items {
            if item is ai:TextChunk {
                lock {
                    self.chunks.push(item.clone());
                }
            } else if item is ai:TextDocument {
                foreach string paragraph in re \`\\n\\s*\\n\`.split(item.content) {
                    ai:TextChunk chunk = {content: paragraph.trim(), metadata: item.metadata};
                    lock {
                        self.chunks.push(chunk.clone());
                    }
                }
            } else {
                return error ai:Error("Only text documents and text chunks are supported");
            }
        }
    }

    // Retrieves the chunks that share the most keywords with the query.
    public isolated function retrieve(string query, int maxLimit, ai:MetadataFilters? filters = ())
            returns ai:QueryMatch[]|ai:Error {
        readonly & string[] queryWords = tokenize(query).cloneReadOnly();
        ai:QueryMatch[] matches;
        lock {
            ai:QueryMatch[] found = [];
            foreach ai:TextChunk chunk in self.chunks {
                int overlap = countOverlap(queryWords, tokenize(chunk.content));
                if overlap > 0 {
                    float similarityScore = <float>overlap / <float>queryWords.length();
                    found.push({chunk: chunk.clone(), similarityScore});
                }
            }
            matches = found.clone();
        }
        return from ai:QueryMatch queryMatch in matches
            order by queryMatch.similarityScore descending
            limit maxLimit
            select queryMatch;
    }

    // Deletes chunks whose metadata matches the given filters.
    public isolated function deleteByFilter(ai:MetadataFilters filters) returns ai:Error? {
        readonly & ai:MetadataFilters readonlyFilters = filters.cloneReadOnly();
        lock {
            ai:TextChunk[] remaining = [];
            foreach ai:TextChunk chunk in self.chunks {
                if !matchesFilters(chunk, readonlyFilters) {
                    remaining.push(chunk);
                }
            }
            self.chunks.removeAll();
            self.chunks.push(...remaining);
        }
    }
}

isolated function countOverlap(string[] queryWords, string[] chunkWords) returns int {
    int overlap = 0;
    foreach string word in queryWords {
        if chunkWords.indexOf(word) != () {
            overlap += 1;
        }
    }
    return overlap;
}

isolated function tokenize(string text) returns string[] =>
    re \`[^a-zA-Z0-9]+\`.split(text.toLowerAscii()).filter(word => word.length() > 2);

// Supports equality filters combined with the \`ai:AND\` condition.
isolated function matchesFilters(ai:TextChunk chunk, ai:MetadataFilters filters) returns boolean {
    ai:Metadata metadata = chunk.metadata ?: {};
    foreach ai:MetadataFilters|ai:MetadataFilter filter in filters.filters {
        if filter is ai:MetadataFilter {
            if metadata[filter.key] != filter.value {
                return false;
            }
        } else if !matchesFilters(chunk, filter) {
            return false;
        }
    }
    return true;
}

// Use the default model provider (with configuration added via a Ballerina VS Code command).
final ai:ModelProvider model = check ai:getDefaultModelProvider();

public function main() returns error? {
    // The custom implementation is used through the \`ai:KnowledgeBase\` type,
    // so the rest of the RAG workflow does not depend on the implementation.
    ai:KnowledgeBase knowledgeBase = new KeywordKnowledgeBase();
    ai:TextDocument policy = {
        metadata: {fileName: "leave_policy.md"},
        content: string \`Full-time employees are entitled to 20 days of paid annual leave per year.

            Employees are entitled to 10 days of paid sick leave per year. A medical
            certificate is required for absences longer than two consecutive days.

            Parental leave is 12 weeks and must be requested one month in advance.\`
    };
    check knowledgeBase.ingest(policy);

    string query = "How many sick leave days do employees get?";
    ai:QueryMatch[] matches = check knowledgeBase.retrieve(query, 2);
    foreach ai:QueryMatch queryMatch in matches {
        io:println("Match: ", queryMatch.chunk.content, " (score: ", queryMatch.similarityScore, ")");
    }

    // Augment the query with the retrieved context and generate the response.
    ai:ChatUserMessage augmentedQuery = ai:augmentUserQuery(matches, query);
    ai:ChatAssistantMessage response = check model->chat(augmentedQuery);
    io:println("\\nAnswer: ", response?.content);
}
`,
];

export function RagCustomKnowledgeBase({ codeSnippets }) {
  const [codeClick1, updateCodeClick1] = useState(false);

  const [outputClick1, updateOutputClick1] = useState(false);
  const ref1 = createRef();

  const [btnHover, updateBtnHover] = useState([false, false]);

  return (
    <Container className="bbeBody d-flex flex-column h-100">
      <h1>Retrieve from a custom knowledge base</h1>

      <p>
        The <code>ai:KnowledgeBase</code> type is the abstraction used for
        ingestion and retrieval in retrieval-augmented generation (RAG)
        workflows. Ballerina provides the <code>ai:VectorKnowledgeBase</code>{" "}
        implementation backed by a vector store and an embedding provider, and
        modules such as{" "}
        <a href="https://central.ballerina.io/ballerinax/ai.azure/latest">
          ballerinax/ai.azure
        </a>{" "}
        provide implementations backed by managed search services (e.g., Azure
        AI Search).
      </p>

      <p>
        You can also implement <code>ai:KnowledgeBase</code> yourself to
        integrate any retrieval backend, such as a full-text search engine, an
        existing enterprise search API, or a hybrid of keyword and vector
        search. A custom knowledge base must implement the <code>ingest</code>,{" "}
        <code>retrieve</code>, and <code>deleteByFilter</code> methods. Since
        the rest of the workflow (e.g., <code>ai:augmentUserQuery</code>) only
        depends on the <code>ai:KnowledgeBase</code> type, the implementation
        can be swapped without changing the application logic.
      </p>

      <p>
        This example demonstrates a simple keyword-based knowledge base
        implementation and its use in a RAG workflow.
      </p>

      <blockquote>
        <p>
          Note: This example uses the default model provider implementation. To
          generate the necessary configuration, open up the VS Code command
          palette (<code>Ctrl</code> + <code>Shift</code> + <code>P</code> or{" "}
          <code>command</code> + <code>shift</code> + <code>P</code>), and run
          the <code>Configure default WSO2 Model Provider</code> command to add
          your configuration to the <code>Config.toml</code> file. If not
          already logged in, log in to the Ballerina Copilot when prompted.
          Alternatively, to use your own keys, use the relevant{" "}
          <code>ballerinax/ai.&lt;provider&gt;</code> model provider
          implementation.
        </p>
      </blockquote>

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
              <span>{`\$ bal run rag_custom_knowledge_base.bal`}</span>
              <span>{`Match: Employees are entitled to 10 days of paid sick leave per year. A medical`}</span>
              <span>{`            certificate is required for absences longer than two consecutive days. (score: 0.5714285714285714)`}</span>
              <span>{`Match: Full-time employees are entitled to 20 days of paid annual leave per year. (score: 0.42857142857142855)`}</span>
              <span>{`
`}</span>
              <span>{`Answer: Employees are entitled to 10 days of paid sick leave per year.`}</span>
            </code>
          </pre>
        </Col>
      </Row>

      <h2>Related links</h2>

      <ul style={{ marginLeft: "0px" }} class="relatedLinks">
        <li>
          <span>&#8226;&nbsp;</span>
          <span>
            <a href="/learn/by-example/rag-in-memory-vector-store-retrieval/">
              The Retrieve from an in-memory vector store example
            </a>
          </span>
        </li>
      </ul>
      <ul style={{ marginLeft: "0px" }} class="relatedLinks">
        <li>
          <span>&#8226;&nbsp;</span>
          <span>
            <a href="/learn/by-example/rag-query-with-metadata-filters/">
              The Filter results by metadata example
            </a>
          </span>
        </li>
      </ul>
      <ul style={{ marginLeft: "0px" }} class="relatedLinks">
        <li>
          <span>&#8226;&nbsp;</span>
          <span>
            <a href="https://central.ballerina.io/ballerinax/ai.azure/latest">
              The <code>ballerinax/ai.azure</code> module (Azure AI Search
              knowledge base)
            </a>
          </span>
        </li>
      </ul>
      <span style={{ marginBottom: "20px" }}></span>

      <Row className="mt-auto mb-5">
        <Col sm={6}>
          <Link
            title="Filter results by metadata"
            href="/learn/by-example/rag-query-with-metadata-filters/"
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
                  Filter results by metadata
                </span>
              </div>
            </div>
          </Link>
        </Col>
        <Col sm={6}>
          <Link
            title="Agentic RAG with WSO2 Cloud"
            href="/learn/by-example/agentic-rag-with-wso2-integration-knowledge-base/"
          >
            <div className="btnContainer d-flex align-items-center ms-auto">
              <div className="d-flex flex-column me-4">
                <span className="btnNext">Next</span>
                <span
                  className={btnHover[1] ? "btnTitleHover" : "btnTitle"}
                  onMouseEnter={() => updateBtnHover([false, true])}
                  onMouseOut={() => updateBtnHover([false, false])}
                >
                  Agentic RAG with WSO2 Cloud
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
