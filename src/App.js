import React, { useCallback, useEffect, useRef, useState } from 'react'
import styled from 'styled-components'
import { editor } from './editor'
import logo from './logo.svg'
import { Validations } from './Validations'

const VALIDATOR_URL = 'https://jats-validator.onrender.com'
// const VALIDATOR_URL = 'http://localhost:4000'

const Container = styled.div`
  display: flex;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Helvetica Neue', Arial, sans-serif;
`

const Main = styled.div`
  flex: 1;
  width: 60%;
  max-width: 60%;
  height: 100%;
  display: flex;
  flex-direction: column;
`

const Editor = styled.div`
  flex: 1;
  overflow: hidden;

  .CodeMirror {
    height: 100%;

    pre.CodeMirror-placeholder {
      color: #777;
    }
  }
`

const Sidebar = styled.div`
  flex: 1;
  width: 40%;
  max-width: 40%;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  box-sizing: border-box;
  padding: 24px 8px;
`

const Header = styled.div`
  padding: 16px 32px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 120%;
  flex-wrap: wrap;
  line-height: 1;
`

const Brand = styled.span`
  color: #666865;
  font-weight: 500;
  font-size: 23px;
`

const Logo = styled.div`
  display: flex;
  align-items: center;

  a {
    text-decoration: none;
  }
`

const Message = styled.div`
  padding: 16px;
`

const Form = styled.form`
  display: flex;
  align-items: center;
  padding: 16px;
  margin: 0;
`

const SchematronLabel = styled.label`
  display: flex;
  align-items: center;

  select {
    margin-right: 1ch;
  }
`

export const App = () => {
  const [error, setError] = useState(undefined)
  const [formatting, setFormatting] = useState(false)
  const [xml, setXML] = useState(undefined)
  const [annotations, setAnnotations] = useState([])
  const [schematron, setSchematron] = useState('jats4r')

  const inputRef = useRef(undefined)

  const addAnnotations = useCallback(newAnnotations => {
    setAnnotations(annotations => [...annotations, ...newAnnotations])
  }, [])

  useEffect(() => {
    editor.setOption('lint', {
      getAnnotations: () => annotations,
    })

    editor.performLint()
  }, [annotations])

  useEffect(() => {
    editor.on('change', editor => {
      setXML(editor.getValue())
    })
  }, [])

  useEffect(() => {
    // TODO: add hashchange listener?
    const params = new URLSearchParams(window.location.search.substr(1))

    if (params.get('url')) {
      editor.setValue('')
      setFormatting(true)
      setError(undefined)

      fetch(params.get('url'))
        .then(response => response.text())
        .then(xml => {
          editor.setValue(xml)
          setFormatting(false)
        })
    }
  }, [])

  useEffect(() => {
    if (!xml) {
      setAnnotations([])
    }
  }, [xml])

  const attachEditor = useCallback(node => {
    if (node) {
      node.appendChild(editor.display.wrapper)
      editor.refresh()
    }
  }, [])

  const scrollTo = useCallback(line => {
    if (!Number.isInteger(line)) {
      return
    }

    const pos = {
      line,
      ch: 0,
    }

    editor.getDoc().setSelection(pos)

    // scroll to line
    const height = editor.getScrollInfo().clientHeight
    const coords = editor.charCoords(pos, 'local')
    editor.scrollTo(null, (coords.top + coords.bottom - height) / 2)
  }, [])

  const onClick = useCallback(event => {
    event.currentTarget.value = ''
    editor.setValue('')
  }, [])

  const validate = useCallback(() => {
    const input = inputRef.current

    if (input.files.length) {
      editor.setValue('')
      setFormatting(true)
      setError(undefined)

      const body = new FormData()
      body.set('xml', input.files[0])

      fetch(`${VALIDATOR_URL}/format/`, {
        method: 'POST',
        body,
      })
        .then(async response => {
          if (!response.ok) {
            if (response.status === 422) {
              const data = await response.json()

              throw new Error('ERROR: ' + data.error)
            }

            throw new Error('There was an error')
          }

          return response.text()
        })
        .then(xml => {
          editor.setValue(xml)
          setFormatting(false)
        })
        .catch(error => {
          setError(error)
        })
    }
  }, [inputRef])

  const onSubmit = useCallback(
    event => {
      event.preventDefault()
      validate()
    },
    [validate]
  )

  const handleSchematronChange = useCallback(event => {
    setSchematron(event.target.value)
  }, [])

  return (
    <Container>
      <Main>
        <Header>
          <Logo>
            <a href={'https://elifesciences.org/'}>
              <img src={logo} alt={'eLife logo'} height={64} />
            </a>
            <Brand>Validator</Brand>
          </Logo>

          <Form onSubmit={onSubmit}>
            <input
              ref={inputRef}
              type={'file'}
              tabIndex={1}
              accept={'.xml'}
              onChange={validate}
              onClick={onClick}
            />
            <button
              type={'submit'}
              style={{
                visibility: xml ? 'visible' : 'hidden',
              }}
            >
              Revalidate
            </button>
          </Form>
        </Header>

        {editor.getValue() ? <Editor ref={attachEditor} tabIndex={2} /> : null}
      </Main>

      <Sidebar>
        {(() => {
          if (error) {
            return <Message>{error.message}</Message>
          }

          if (formatting) {
            return <Message>Formatting XML…</Message>
          }

          if (!xml) {
            return null
          }

          return (
            <div>
              <Validations
                title={'JATS DTD'}
                url={`${VALIDATOR_URL}/dtd/`}
                xml={xml}
                addAnnotations={addAnnotations}
                scrollTo={scrollTo}
              />

              <Validations
                title={
                  <SchematronLabel>
                    <select
                      onChange={handleSchematronChange}
                      value={schematron}
                    >
                      <option value={'jats4r'}>JATS4R</option>
                      <option value={'elife-pre'}>eLife pre</option>
                      <option value={'elife-final'}>eLife final</option>
                    </select>
                    Schematron
                  </SchematronLabel>
                }
                url={`${VALIDATOR_URL}/schematron/`}
                xml={xml}
                schematron={schematron}
                addAnnotations={addAnnotations}
                scrollTo={scrollTo}
              />
            </div>
          )
        })()}
      </Sidebar>
    </Container>
  )
}
