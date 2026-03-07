// frontend/src/components/ResumeUpload.jsx

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, FileText, X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { resumeAPI } from '../api/axios'
import toast from 'react-hot-toast'

function ResumeUpload({ onUploadSuccess, targetRole = '' }) {
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadedFile, setUploadedFile] = useState(null)
  const [error, setError] = useState(null)

  const onDrop = useCallback(async (acceptedFiles) => {
    const file = acceptedFiles[0]
    if (!file) return

    // Validate file
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
      'text/plain'
    ]

    if (!allowedTypes.includes(file.type)) {
      setError('Please upload a PDF, DOCX, DOC, or TXT file')
      toast.error('Invalid file type')
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB')
      toast.error('File too large')
      return
    }

    setUploading(true)
    setError(null)
    setUploadProgress(0)
    setUploadedFile({ name: file.name, size: file.size })

    // Simulate progress
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => Math.min(prev + 10, 90))
    }, 200)

    try {
      const response = await resumeAPI.upload(file, targetRole)
      clearInterval(progressInterval)
      setUploadProgress(100)

      toast.success('Resume uploaded and parsed successfully!')

      setTimeout(() => {
        onUploadSuccess?.(response.data)
      }, 500)
    } catch (err) {
      clearInterval(progressInterval)
      const message = err.response?.data?.detail || 'Upload failed'
      setError(message)
      toast.error(message)
      setUploadedFile(null)
    } finally {
      setUploading(false)
    }
  }, [targetRole, onUploadSuccess])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/msword': ['.doc'],
      'text/plain': ['.txt']
    },
    maxFiles: 1,
    disabled: uploading
  })

  const reset = () => {
    setUploadedFile(null)
    setUploadProgress(0)
    setError(null)
  }

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  return (
    <div className="w-full">
      {!uploadedFile ? (
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 ${
            isDragActive
              ? 'border-primary-500 bg-primary-50'
              : 'border-gray-300 hover:border-primary-400 hover:bg-gray-50'
          } ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <input {...getInputProps()} />

          <div className="flex flex-col items-center gap-4">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
              isDragActive ? 'bg-primary-100' : 'bg-gray-100'
            }`}>
              <Upload className={`w-8 h-8 ${isDragActive ? 'text-primary-600' : 'text-gray-400'}`} />
            </div>

            <div>
              <p className="text-lg font-medium text-gray-700">
                {isDragActive ? 'Drop your resume here' : 'Drag & drop your resume'}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                or click to browse (PDF, DOCX, DOC, TXT)
              </p>
            </div>

            <p className="text-xs text-gray-400">Maximum file size: 10MB</p>
          </div>
        </div>
      ) : (
        <div className="border border-gray-200 rounded-xl p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <FileText className="w-6 h-6 text-primary-600" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <p className="font-medium text-gray-900 truncate">{uploadedFile.name}</p>
                {!uploading && (
                  <button onClick={reset} className="p-1 hover:bg-gray-100 rounded">
                    <X className="w-4 h-4 text-gray-400" />
                  </button>
                )}
              </div>
              <p className="text-sm text-gray-500">{formatFileSize(uploadedFile.size)}</p>

              {/* Progress bar */}
              <div className="mt-3">
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary-600 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>

                <div className="flex items-center justify-between mt-2">
                  {uploading ? (
                    <span className="flex items-center gap-2 text-sm text-gray-600">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Parsing resume...
                    </span>
                  ) : uploadProgress === 100 ? (
                    <span className="flex items-center gap-2 text-sm text-success-600">
                      <CheckCircle className="w-4 h-4" />
                      Upload complete!
                    </span>
                  ) : error ? (
                    <span className="flex items-center gap-2 text-sm text-danger-600">
                      <AlertCircle className="w-4 h-4" />
                      {error}
                    </span>
                  ) : null}

                  <span className="text-sm text-gray-500">{uploadProgress}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ResumeUpload
