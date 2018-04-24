import * as React from 'react';
import styled from 'styled-components';
import MonacoEditor from 'react-monaco-editor';

const LogsWrapper = styled.div`
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
`;

class Logs extends React.Component<{ logs: any[] }, {}> {
  editor;
  editorRef;

  constructor(props) {
    super(props);
    this.editorRef = React.createRef();
  }

  handleEditorDidMount = editor => (this.editor = editor);
  handleResize = () => this.editor.layout();
  componentDidMount() {
    window.addEventListener('resize', this.handleResize);
  }

  render() {
    const requireConfig = {
      url:
        'https://cdnjs.cloudflare.com/ajax/libs/require.js/2.3.1/require.min.js',
      paths: {
        vs: 'https://unpkg.com/monaco-editor@0.7.0/min/vs',
      },
    };
    const { logs } = this.props;
    if (this.editor && this.editorRef.current) {
      const height = this.editorRef.current.editor._view.domNode.clientHeight;
      const shouldScroll =
        this.editor.getScrollHeight() - this.editor.getScrollTop() <= height;
      if (shouldScroll) {
        this.editor.revealLine(logs.length);
      }
    }
    return (
      <LogsWrapper>
        <MonacoEditor
          language="plaintext"
          value={logs.join('\n')}
          requireConfig={requireConfig}
          editorDidMount={this.handleEditorDidMount}
          options={{
            lineNumbers: false,
            readOnly: true,
            scrollBeyondLastLine: false,
            minimap: { enabled: false },
          }}
          ref={this.editorRef}
        />
      </LogsWrapper>
    );
  }
}

export default Logs;
