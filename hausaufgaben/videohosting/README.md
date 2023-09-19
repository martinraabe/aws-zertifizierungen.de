# Überblick
Das Tutorial wurde mit Cloud9 durchgeführt. Die Cloud9-IDE ist mit AWS-Credentials und Terraform vorkonfiguriert. Zur Vereinfachung hat der Benutzer für diese Demo Admin-Rechte. 
Es wurde folgendes Tutorial mit Terraform automatisiert: [Dokumentation zum Tutorial](https://docs.aws.amazon.com/AmazonS3/latest/userguide/tutorial-s3-cloudfront-route53-video-streaming.html)



# Schritte zur Durchführung: 
* git clone https://github.com/martinraabe/aws-zertifizierungen.de.git
* Wechseln in hausaufgaben/videohosting
* Ausführen von Terraform init
* Ausführen von Terraform plan und prüfen, ob die richtigen Sachen erstellt werden sollen
* Terraform Apply zu Erstellung der Komponenten
* Upload eines Testvideo
* Testen der Cloudfront-Distribution


# Developmentguide zur Automatisierung des Tutorial:

* Erstellen einer main.tf mit dem Code abgeleitet aus https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/s3_bucket 
* Erstellen einer OIA https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/cloudfront_origin_access_identity
* Erstellen einer Cloudfront Distribution https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/cloudfront_distribution

