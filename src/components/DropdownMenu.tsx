import { Menu, Transition } from '@headlessui/react'
import { Fragment, useContext } from 'react'

import {
  ArchiveBox,
  Gear,
  FileZip,
  DownloadSimple,
  UploadSimple,
  Folder,
} from 'phosphor-react'
import { EditorContentContext } from '../contexts/EditorContentContext'

import JSZip from 'jszip'
import { saveAs } from 'file-saver'
import pretty from 'pretty'

import Storage, { StorageState } from '../utils/Storage'
import * as Fepack from '../utils/Fepack'

const zip = new JSZip()

export function DropdownMenu() {
  const { app, handleValueChange } = useContext(EditorContentContext)

  function addScriptsToParsedHtmlHead(parsed: Document) {
    const head = parsed.querySelector('head')!

    const script = document.createElement('script')
    script.type = 'text/javascript'
    script.src = './index.js'
    script.defer = true

    const style = document.createElement('link')
    style.rel = 'stylesheet'
    style.href = './index.css'

    head.appendChild(script)
    head.appendChild(style)

    return parsed
  }

  async function handleDownloadAsZip() {
    const parser = new DOMParser()

    const parsedHTML = parser.parseFromString(app.html, 'text/html')

    const htmlWithScripts = addScriptsToParsedHtmlHead(parsedHTML)

    const doctype = '<!DOCTYPE html>'

    zip.file(
      'index.html',
      pretty(doctype + htmlWithScripts.documentElement.outerHTML),
    )

    zip.file('index.css', app.css)
    zip.file('index.js', app.javascript)
    zip.file('index.md', app.markdown)

    const content = await zip.generateAsync({ type: 'blob' })

    saveAs(content, `frontend-editor-${new Date().toISOString()}.zip`)
  }

  function updateAppData(data: StorageState) {
    handleValueChange('html', data.html || '')
    handleValueChange('css', data.css || '')
    handleValueChange('javascript', data.javascript || '')
    handleValueChange('markdown', data.markdown || '')
  }

  async function handleUploadAsZip() {
    Fepack.loadFile('.zip', (f: any) => {
      const a: any = {}
      const aKeys = ['html', 'css', 'javascript', 'markdown']

      JSZip.loadAsync(f).then((zip: any) => {
        const names: any[] = []
        zip.forEach((relativePath: any, zipEntry: any) => names.push(zipEntry))

        Promise.all(
          names.map((c) =>
            zip.files[c.name].async('string').then((data: any) => {
              let n: string = c.name.split('.').pop()
              if (n === 'js') n = 'javascript'
              if (n === 'md') n = 'markdown'
              if (aKeys.includes(n)) a[n] = data
              return a
            }),
          ),
        ).then((f) => {
          if (Object.keys(f[0]).length === 0)
            return alert(Fepack.getMessages().invalid)
          updateAppData(f[0])
        })
      })
    })
  }

  async function handleDownloadAsFepack() {
    const fep: Fepack.dataType = {
      path: window.location.pathname.replace('/', ''),
      data: {
        html: app.html,
        css: app.css,
        javascript: app.javascript,
        markdown: app.markdown,
      },
    }

    Fepack.save(fep)
  }

  async function handleLoadAsFepack() {
    Fepack.load((data: Fepack.dataType, replace: boolean = false) => {
      if (!data) return alert(Fepack.getMessages().invalid)

      // Saving and go
      const stg: any = data.data

      if (!replace) window.history.replaceState(null, '', '/' + data.path.toString())

      updateAppData(stg)
    })
  }

  async function handleLoadProject(data: any) {
    const prefix = 'fronteditor:'
    const path = data.path === '/' ? '' : data.path
    const s = JSON.parse(window.localStorage.getItem(`${prefix}${path}`)!)

    const d = {
      html: s.html,
      css: s.css,
      javascript: s.javascript,
      markdown: s.markdown,
    }

    window.history.replaceState(null, '', '/' + path.toString())
    updateAppData(d)
  }

  function loadStorageData() {
    const prefix = 'fronteditor:'
    const result = []
    for (const key in localStorage) {
      if (key.substring(0, prefix.length) === prefix)
        result.push(key.substring(prefix.length))
    }

    return result.map((r): any => {
      const a = JSON.parse(window.localStorage.getItem(`${prefix}${r}`)!)
      return { name: a.name || r || '/', path: a.path || r }
    })
  }

  const projects = loadStorageData()

  return (
    <div className="top-16">
      <Menu as="div" className="relative inline-block text-left">
        <div>
          <Menu.Button className="inline-flex text-gray-400 hover:text-gray-200 items-center w-full justify-center rounded-md p-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75">
            <Gear size={18} weight="bold" />
          </Menu.Button>
        </div>
        <Transition
          as={Fragment}
          enter="transition ease-out duration-100"
          enterFrom="transform opacity-0 scale-95"
          enterTo="transform opacity-100 scale-100"
          leave="transition ease-in duration-75"
          leaveFrom="transform opacity-100 scale-100"
          leaveTo="transform opacity-0 scale-95"
        >
          <Menu.Items className="absolute right-0 mt-2 w-56 origin-top-right divide-y divide-gray-100 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
            <div className="px-1 py-1">
              <Menu.Item>
                {({ active }) => (
                  <button
                    className={`${
                      active ? 'bg-green-400 text-gray-900' : 'text-gray-900'
                    } group flex w-full items-center rounded-md px-2 py-2 text-sm`}
                    onClick={handleDownloadAsZip}
                  >
                    <ArchiveBox size={20} className="mr-2" />
                    Download as ZIP
                  </button>
                )}
              </Menu.Item>
              <Menu.Item>
                {({ active }) => (
                  <button
                    className={`${
                      active ? 'bg-green-400 text-gray-900' : 'text-gray-900'
                    } group flex w-full items-center rounded-md px-2 py-2 text-sm`}
                    onClick={handleUploadAsZip}
                  >
                    <FileZip size={20} className="mr-2" />
                    Upload as ZIP
                  </button>
                )}
              </Menu.Item>
              <hr className="my-1 border-1 border-gray-400" />
              <Menu.Item>
                {({ active }) => (
                  <button
                    className={`${
                      active ? 'bg-green-400 text-gray-900' : 'text-gray-900'
                    } group flex w-full items-center rounded-md px-2 py-2 text-sm`}
                    onClick={handleLoadAsFepack}
                  >
                    <UploadSimple size={20} className="mr-2" />
                    Load a Fepack
                  </button>
                )}
              </Menu.Item>
              <Menu.Item>
                {({ active }) => (
                  <button
                    className={`${
                      active ? 'bg-green-400 text-gray-900' : 'text-gray-900'
                    } group flex w-full items-center rounded-md px-2 py-2 text-sm`}
                    onClick={handleDownloadAsFepack}
                  >
                    <DownloadSimple size={20} className="mr-2" />
                    Save as Fepack
                  </button>
                )}
              </Menu.Item>
              {projects.length > 0 && (
                <>
                  <hr className="my-1 border-1 border-gray-400" />
                  <h3 className="bg-gray-100 py-2 text-sm text-gray-400 uppercase text-center">
                    Projects
                  </h3>
                </>
              )}
              <div style={{ maxHeight: 400, overflowY: 'auto' }}>
                {projects.map((r, key) => (
                  <Menu.Item key={key}>
                    {({ active }) => (
                      <button
                        className={`${
                          active
                            ? 'bg-green-400 text-gray-900'
                            : 'text-gray-900'
                        } group flex w-full items-center rounded-md px-2 py-2 text-sm ${
                          '/' + r.path === window.location.pathname
                            ? 'bg-slate-200 font-medium'
                            : ''
                        }`}
                        onClick={() => {
                          handleLoadProject(r)
                        }}
                      >
                        <Folder size={20} className="mr-2" />
                        {r.name}
                      </button>
                    )}
                  </Menu.Item>
                ))}
              </div>
            </div>
          </Menu.Items>
        </Transition>
      </Menu>
    </div>
  )
}
