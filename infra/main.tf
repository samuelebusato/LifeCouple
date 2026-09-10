# ==========================================================================
# Landing di LifeCouple — S3 privato + CloudFront.
#
# Nasce dal modulo HeleoX/infra/modules/static-site, che fa lo stesso
# mestiere ed e' gia' in produzione su www.heleox.it. NON e' riusato come
# modulo, e non e' nemmeno una copia fedele: due differenze sono deliberate,
# e stanno scritte accanto alla risorsa che le porta.
#
#   1. Nessun fallback SPA. Il modulo di HeleoX rimanda 403/404 a index.html
#      con HTTP 200, perche' li' c'e' un'app React con routing lato client.
#      Qui sarebbe un difetto: un URL sbagliato di una pagina legale
#      servirebbe in silenzio la homepage con "200 OK" a un revisore Apple
#      che cerca QUEL testo a QUELL'indirizzo.
#   2. CSP completa invece della sola frame-ancestors. Il modulo di HeleoX si
#      ferma a frame-ancestors dichiarando il perche': non si sapeva cosa
#      caricasse davvero il bundle Vite. Qui si sa -- verificato a pagina
#      aperta il 2026-09-10: 3 immagini, 2 font, zero JavaScript, zero
#      risorse esterne. La ragione del rinvio non si applica.
#
# Il dominio: lifecouple.heleox.it, aggiunto il 2026-09-10. Il DNS vive su
# Cloudflare e il record e' un CNAME in "DNS only" verso la distribuzione:
# proxiandolo, Cloudflare entrerebbe nel percorso come destinatario dell'IP
# di ogni visitatore -- un terzo che l'informativa non nomina -- e potrebbe
# depositare il cookie __cf_bm, mentre la cookie policy linkata da questa
# stessa pagina dichiara che nessuno segue chi legge.
# ==========================================================================

locals {
  nome    = "lifecouple-landing-790304250429"
  dominio = "lifecouple.heleox.it"
}

# ------------------------------------------------------------ CERTIFICATO
# In us-east-1 per il vincolo CloudFront (vedi backend.tf). Validazione DNS
# invece che via email: la prova e' un record nella zona, quindi si rinnova
# da sola finche' il record resta -- una validazione via email va rifatta a
# mano ogni volta, e prima o poi non la rifa' nessuno.
resource "aws_acm_certificate" "landing" {
  provider = aws.us_east_1

  domain_name       = local.dominio
  validation_method = "DNS"

  lifecycle {
    # Un certificato in uso da CloudFront non si puo' cancellare: se un
    # domani cambiasse il nome, il nuovo va creato PRIMA di togliere il
    # vecchio, altrimenti l'apply si blocca a meta'.
    create_before_destroy = true
  }
}

# Attende che il certificato risulti emesso. ⚠️ Il record di validazione lo
# aggiunge una persona su Cloudflare: questa risorsa non lo crea, lo aspetta.
resource "aws_acm_certificate_validation" "landing" {
  provider = aws.us_east_1

  certificate_arn = aws_acm_certificate.landing.arn

  timeouts {
    create = "30m"
  }
}

# --------------------------------------------------------------- IL BUCKET
# Privato: nessun accesso pubblico diretto, legge solo CloudFront via OAC
# (Origin Access Control, il meccanismo che AWS raccomanda al posto della
# piu' vecchia Origin Access Identity).
resource "aws_s3_bucket" "landing" {
  bucket = local.nome
}

resource "aws_s3_bucket_public_access_block" "landing" {
  bucket = aws_s3_bucket.landing.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_cloudfront_origin_access_control" "landing" {
  name                              = "${local.nome}-oac"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

# ------------------------------------------------------- HEADER DI RISPOSTA
# La CSP e' stretta perche' la pagina lo permette: default-src 'none' come
# base, e si riapre soltanto cio' che serve davvero.
#
#   - script-src non compare: default-src 'none' lo copre, e la landing non
#     ha una sola riga di JavaScript (verificato: 0 <script> e 0 gestori
#     inline in tutte e tre le pagine). Un XSS qui non ha dove eseguire.
#   - style-src ha 'unsafe-inline' per necessita' reale: il CSS sta in un
#     blocco <style> e ci sono 89 attributi style="..." nella pagina. Non e'
#     una concessione di comodo, e senza JavaScript il rischio che
#     'unsafe-inline' sugli stili porta con se' e' molto ridotto.
#   - font-src 'self' e' la meta' tecnica della scelta di auto-ospitare i
#     caratteri: se qualcuno rimettesse un <link> a fonts.googleapis.com il
#     browser lo BLOCCA. La promessa della cookie policy («nothing follows
#     you») smette cosi' di dipendere dalla memoria di chi modifica il file.
resource "aws_cloudfront_response_headers_policy" "landing" {
  name = "${local.nome}-security-headers"

  security_headers_config {
    frame_options {
      frame_option = "DENY"
      override     = true
    }
    content_type_options {
      override = true
    }
    referrer_policy {
      referrer_policy = "strict-origin-when-cross-origin"
      override        = true
    }
    strict_transport_security {
      access_control_max_age_sec = 31536000
      include_subdomains         = true
      override                   = true
    }
    content_security_policy {
      content_security_policy = join("; ", [
        "default-src 'none'",
        "img-src 'self'",
        "style-src 'self' 'unsafe-inline'",
        "font-src 'self'",
        "base-uri 'none'",
        "form-action 'none'",
        "frame-ancestors 'none'",
      ])
      override = true
    }
  }
}

# --------------------------------------------------------------- CLOUDFRONT
resource "aws_cloudfront_distribution" "landing" {
  enabled             = true
  default_root_object = "index.html"
  comment             = "Landing di LifeCouple"

  # Solo Nord America ed Europa: e' dove sta chi cerca l'app, e costa meno di
  # PriceClass_All. Stessa scelta del modulo di HeleoX.
  price_class = "PriceClass_100"

  origin {
    domain_name              = aws_s3_bucket.landing.bucket_regional_domain_name
    origin_id                = "s3-${local.nome}"
    origin_access_control_id = aws_cloudfront_origin_access_control.landing.id
  }

  default_cache_behavior {
    target_origin_id       = "s3-${local.nome}"
    viewer_protocol_policy = "redirect-to-https"
    allowed_methods        = ["GET", "HEAD"]
    cached_methods         = ["GET", "HEAD"]
    compress               = true

    # "CachingOptimized", policy gestita da AWS: per un sito statico non
    # serve definirne una da zero.
    cache_policy_id            = "658327ea-f89d-4fab-a63d-7e88639e58f6"
    response_headers_policy_id = aws_cloudfront_response_headers_policy.landing.id
  }

  # Un 404 VERO, che resta 404. Qui sta la differenza col modulo di HeleoX,
  # ed e' la ragione per cui la bucket policy piu' sotto concede anche
  # s3:ListBucket: senza quel permesso S3 risponde 403 alle chiavi che non
  # esistono, e non si distinguerebbe "pagina inesistente" da "permessi
  # rotti". Il 403 e' rimappato anch'esso su 404, per non far capire a un
  # estraneo quali oggetti esistono nel bucket.
  custom_error_response {
    error_code         = 404
    response_code      = 404
    response_page_path = "/404.html"
  }

  custom_error_response {
    error_code         = 403
    response_code      = 404
    response_page_path = "/404.html"
  }

  aliases = [local.dominio]

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    # Dipende dalla VALIDAZIONE, non dal certificato: CloudFront rifiuta un
    # certificato non ancora emesso, e senza questo riferimento Terraform
    # proverebbe ad agganciarlo troppo presto.
    acm_certificate_arn      = aws_acm_certificate_validation.landing.certificate_arn
    ssl_support_method       = "sni-only"
    minimum_protocol_version = "TLSv1.2_2021"
  }
}

# ------------------------------------------------------------ BUCKET POLICY
# Il Principal e' il SERVIZIO CloudFront: e' la condizione su AWS:SourceArn a
# restringere l'accesso a questa sola distribuzione. "Block public access"
# resta attivo -- qui dentro non c'e' nessun principal pubblico.
data "aws_iam_policy_document" "landing" {
  statement {
    sid       = "LetturaOggettiDaCloudFront"
    effect    = "Allow"
    actions   = ["s3:GetObject"]
    resources = ["${aws_s3_bucket.landing.arn}/*"]

    principals {
      type        = "Service"
      identifiers = ["cloudfront.amazonaws.com"]
    }

    condition {
      test     = "StringEquals"
      variable = "AWS:SourceArn"
      values   = [aws_cloudfront_distribution.landing.arn]
    }
  }

  # Trasforma i 403 sugli URL inesistenti in 404 veri, senza esporre alcun
  # listing pubblico. Attenzione alle resource: GetObject va sugli OGGETTI
  # (.../*), ListBucket sul BUCKET (senza /*) -- invertite, la policy non
  # funziona.
  statement {
    sid       = "ElencoPerI404Veri"
    effect    = "Allow"
    actions   = ["s3:ListBucket"]
    resources = [aws_s3_bucket.landing.arn]

    principals {
      type        = "Service"
      identifiers = ["cloudfront.amazonaws.com"]
    }

    condition {
      test     = "StringEquals"
      variable = "AWS:SourceArn"
      values   = [aws_cloudfront_distribution.landing.arn]
    }
  }
}

resource "aws_s3_bucket_policy" "landing" {
  bucket = aws_s3_bucket.landing.id
  policy = data.aws_iam_policy_document.landing.json
}
