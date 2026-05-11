// 将原图 URL 转换为缩略图 URL
export const getThumbUrl = (originalUrl:any) => {
    if (!originalUrl) return ''
    // 假设原图格式：/uploads/xxx.jpg
    // 转换为：/uploads/thumbs/xxx_thumb.jpg
    const parts = originalUrl.split('/')
    const filename = parts.pop()
    const nameWithoutExt = filename.substring(0, filename.lastIndexOf('.'))
    const thumbFilename = `${nameWithoutExt}_thumb.jpg`
    return `/uploads/thumbs/${thumbFilename}`
}
