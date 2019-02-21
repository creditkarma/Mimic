To install a CLI version, run:

    npm install -g @creditkarma/mimic-cli

CLI version works with exported service definition:
  * Navigate in menu: File > Export Services...
  * Select services you would like to export
  * Click "Export" button
  * Choose location and filename for exported services (for example "exported.mimic")

    ![export]({{ site.baseurl }}/assets/images/export.gif){:.image.is-850.playable}

Run CLI with services you just exported:

    $ mimic exported.mimic

![mimic cli]({{ site.baseurl }}/assets/images/cli.gif){:.image.playable}
