import CodeMirror from 'codemirror'
import 'codemirror/lib/codemirror.css'
import 'codemirror/mode/xml/xml'
import 'codemirror/addon/dialog/dialog'
import 'codemirror/addon/dialog/dialog.css'
import 'codemirror/addon/display/placeholder'
import 'codemirror/addon/edit/matchtags'
import 'codemirror/addon/fold/foldcode'
import 'codemirror/addon/fold/foldgutter'
import 'codemirror/addon/fold/foldgutter.css'
import 'codemirror/addon/fold/xml-fold'
import 'codemirror/addon/hint/show-hint'
import 'codemirror/addon/hint/show-hint.css'
import 'codemirror/addon/hint/xml-hint'
import 'codemirror/addon/search/search'
import 'codemirror/addon/search/searchcursor'
import 'codemirror/addon/selection/active-line'
import 'codemirror/addon/lint/lint'
import 'codemirror/addon/lint/lint.css'

export default CodeMirror

export const createEditor = (textarea, { getAnnotations, placeholder }) =>
  CodeMirror.fromTextArea(textarea, {
    mode: 'xml',
    dragDrop: false,
    foldGutter: true,
    lineNumbers: true,
    lineWrapping: true,
    gutters: [
      'CodeMirror-lint-markers',
      'CodeMirror-linenumbers',
      'CodeMirror-foldgutter',
    ],
    placeholder,
    styleActiveLine: true,
    matchTags: {
      bothTags: true,
    },
    lint: {
      async: true,
      getAnnotations,
      lintOnChange: false,
    },
    extraKeys: {
      Tab: false,
    },
  })
