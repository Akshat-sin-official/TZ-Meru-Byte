import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

interface SEOProps {
    title?: string;
    description?: string;
    keywords?: string;
    ogImage?: string;
    ogType?: string;
    canonical?: string;
}

const SEO = ({
    title,
    description,
    keywords,
    ogImage = '/logo.png',
    ogType = 'website',
    canonical
}: SEOProps) => {
    const location = useLocation()
    // Use the actual domain from window.location or default to martechadda.com
    const baseUrl = typeof window !== 'undefined'
        ? `${window.location.protocol}//${window.location.host}`
        : 'https://martechadda.com'
    const currentUrl = `${baseUrl}${location.pathname}`
    // Add cache-busting parameter to force social media platforms to refresh the image
    const logoUrl = `${baseUrl}/logo.png?v=2`
    // Only append "| MarTechAdda" if title doesn't already contain it
    const finalTitle = title
        ? (title.includes('| MarTechAdda') ? title : `${title} | MarTechAdda`)
        : 'MarTechAdda | Find & Hire Marketing Experts with Clarity'
    const finalDescription = description || 'A neutral platform to find, connect, and hire verified marketing experts. Built for businesses and marketing professionals.'
    const finalCanonical = canonical || currentUrl

    useEffect(() => {
        // Update document title
        document.title = finalTitle

        // Update or create meta tags
        const updateMetaTag = (name: string, content: string, isProperty: boolean = false) => {
            const attribute = isProperty ? 'property' : 'name'
            let element = document.querySelector(`meta[${attribute}="${name}"]`)

            if (!element) {
                element = document.createElement('meta')
                element.setAttribute(attribute, name)
                document.head.appendChild(element)
            }
            element.setAttribute('content', content)
        }

        // Update primary meta tags
        updateMetaTag('title', finalTitle)
        updateMetaTag('description', finalDescription)
        // Removed keywords meta tag - legacy and not recommended

        // Update Open Graph tags
        updateMetaTag('og:title', finalTitle, true)
        updateMetaTag('og:description', finalDescription, true)
        updateMetaTag('og:url', currentUrl, true)
        updateMetaTag('og:image', logoUrl, true)
        updateMetaTag('og:image:width', '1200', true)
        updateMetaTag('og:image:height', '630', true)
        updateMetaTag('og:image:type', 'image/png', true)
        updateMetaTag('og:type', ogType, true)

        // Update Twitter tags
        updateMetaTag('twitter:title', finalTitle)
        updateMetaTag('twitter:description', finalDescription)
        updateMetaTag('twitter:image', logoUrl)
        updateMetaTag('twitter:card', 'summary_large_image')
        updateMetaTag('twitter:site', '@martechadda')
        updateMetaTag('twitter:creator', '@martechadda')

        // Update canonical link
        let canonicalLink = document.querySelector('link[rel="canonical"]')
        if (!canonicalLink) {
            canonicalLink = document.createElement('link')
            canonicalLink.setAttribute('rel', 'canonical')
            document.head.appendChild(canonicalLink)
        }
        canonicalLink.setAttribute('href', finalCanonical)

        // Add/update OG site_name
        updateMetaTag('og:site_name', 'MarTechAdda', true)
        updateMetaTag('og:locale', 'en_IN', true)

        // Geo targeting
        updateMetaTag('geo.region', 'IN')
        updateMetaTag('geo.placename', 'India')
    }, [finalTitle, finalDescription, keywords, currentUrl, ogImage, ogType, finalCanonical])

    return null
}

export default SEO
