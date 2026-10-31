import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

interface Breadcrumb {
    name: string;
    path?: string;
    url?: string;
}

interface Article {
    headline?: string;
    description?: string;
    datePublished?: string;
    dateModified?: string;
}

interface Person {
    name: string;
    description: string;
    jobTitle?: string;
    organization?: string;
    image?: string;
}

interface FAQQuestion {
    question: string;
    answer: string;
}

interface FAQ {
    questions: FAQQuestion[];
}

interface SchemaMarkupProps {
    type?: 'WebPage' | 'Article' | 'Person' | 'FAQPage' | 'Organization';
    breadcrumbs?: Breadcrumb[] | null;
    article?: Article | null;
    person?: Person | null;
    faq?: FAQ | null;
    organization?: any | null;
}

/**
 * SchemaMarkup Component
 * Adds JSON-LD structured data for SEO
 * Supports: BreadcrumbList, WebPage, Article, Person, FAQPage, Organization
 */
const SchemaMarkup = ({
    type = 'WebPage',
    breadcrumbs = null,
    article = null,
    person = null,
    faq = null,
    organization = null
}: SchemaMarkupProps) => {
    const location = useLocation()
    const baseUrl = typeof window !== 'undefined'
        ? `${window.location.protocol}//${window.location.host}`
        : 'https://martechadda.com'
    const currentUrl = `${baseUrl}${location.pathname}`

    useEffect(() => {
        // Remove existing schema scripts
        const existingScripts = document.querySelectorAll('script[type="application/ld+json"]')
        existingScripts.forEach(script => {
            // Keep the base schemas from index.html (WebSite, Organization, Service)
            const content = script.textContent || ''
            if (!content.includes('"@type": "WebSite"') &&
                !content.includes('"@type": "Organization"') &&
                !content.includes('"@type": "Service"')) {
                script.remove()
            }
        })

        const schemas: any[] = []

        // BreadcrumbList Schema
        if (breadcrumbs && Array.isArray(breadcrumbs) && breadcrumbs.length > 0) {
            const breadcrumbSchema = {
                '@context': 'https://schema.org',
                '@type': 'BreadcrumbList',
                'itemListElement': breadcrumbs.map((crumb, index) => ({
                    '@type': 'ListItem',
                    'position': index + 1,
                    'name': crumb.name,
                    'item': crumb.url || `${baseUrl}${crumb.path}`
                }))
            }
            schemas.push(breadcrumbSchema)
        }

        // WebPage Schema
        if (type === 'WebPage') {
            const webpageSchema = {
                '@context': 'https://schema.org',
                '@type': 'WebPage',
                'url': currentUrl,
                'name': document.title || 'MarTechAdda',
                'description': (document.querySelector('meta[name="description"]') as HTMLMetaElement)?.content || '',
                'inLanguage': 'en-US',
                'isPartOf': {
                    '@type': 'WebSite',
                    'name': 'MarTechAdda',
                    'url': baseUrl
                }
            }
            schemas.push(webpageSchema)
        }

        // Article Schema
        if (article && type === 'Article') {
            const articleSchema = {
                '@context': 'https://schema.org',
                '@type': 'Article',
                'headline': article.headline || document.title,
                'description': article.description || (document.querySelector('meta[name="description"]') as HTMLMetaElement)?.content,
                'url': currentUrl,
                'datePublished': article.datePublished || new Date().toISOString(),
                'dateModified': article.dateModified || new Date().toISOString(),
                'author': {
                    '@type': 'Organization',
                    'name': 'MarTechAdda'
                },
                'publisher': {
                    '@type': 'Organization',
                    'name': 'MarTechAdda',
                    'logo': {
                        '@type': 'ImageObject',
                        'url': `${baseUrl}/logo.png`
                    }
                }
            }
            schemas.push(articleSchema)
        }

        // Person Schema (for expert profiles)
        if (person && type === 'Person') {
            const personSchema = {
                '@context': 'https://schema.org',
                '@type': 'Person',
                'name': person.name,
                'description': person.description,
                'url': currentUrl,
                'jobTitle': person.jobTitle || 'Marketing Expert',
                'worksFor': {
                    '@type': 'Organization',
                    'name': person.organization || 'Independent Marketing Professional'
                },
                ...(person.image && {
                    'image': {
                        '@type': 'ImageObject',
                        'url': person.image
                    }
                })
            }
            schemas.push(personSchema)
        }

        // FAQPage Schema
        if (faq && type === 'FAQPage') {
            const faqSchema = {
                '@context': 'https://schema.org',
                '@type': 'FAQPage',
                'mainEntity': faq.questions.map(q => ({
                    '@type': 'Question',
                    'name': q.question,
                    'acceptedAnswer': {
                        '@type': 'Answer',
                        'text': q.answer
                    }
                }))
            }
            schemas.push(faqSchema)
        }

        // Add all schemas to the page
        schemas.forEach((schema, index) => {
            const script = document.createElement('script')
            script.type = 'application/ld+json'
            script.id = `schema-markup-${index}`
            script.textContent = JSON.stringify(schema, null, 2)
            document.head.appendChild(script)
        })

        // Cleanup function
        return () => {
            schemas.forEach((_, index) => {
                const script = document.getElementById(`schema-markup-${index}`)
                if (script) {
                    script.remove()
                }
            })
        }
    }, [type, breadcrumbs, article, person, faq, organization, currentUrl, baseUrl])

    return null
}

export default SchemaMarkup
