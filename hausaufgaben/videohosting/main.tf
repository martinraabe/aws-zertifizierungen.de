resource "aws_s3_bucket" "content_bucket" {
  bucket = "${local.projektname}"

  tags = {
    Name = "content_bucket_${local.projektname}"
  }
}

resource "aws_cloudfront_origin_access_identity" "S3-OIA" {
  comment = "Origin Access Identiy fuer den Upload von Trainingsvideos und Inhalten für ${local.projektname}"
}

