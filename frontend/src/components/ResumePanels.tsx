const LEFT_IMAGES = ['/resumes/yushiroResume.png', '/resumes/duckResume.png']
const RIGHT_IMAGES = ['/resumes/taotaoResume.png', '/resumes/yozureResume.png']

function ResumePanel({ images, side }: { images: string[]; side: 'left' | 'right' }) {
  return (
    <aside className={`resume-panel resume-panel--${side}`}>
      {images.map((src) => (
        <div key={src} className="resume-panel__card">
          <img src={src} alt={`${side} resume`} />
        </div>
      ))}
    </aside>
  )
}

export function ResumePanels() {
  return (
    <>
      <ResumePanel images={LEFT_IMAGES} side="left" />
      <ResumePanel images={RIGHT_IMAGES} side="right" />
    </>
  )
}
