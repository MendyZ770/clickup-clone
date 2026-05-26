package com.done.app;

import android.os.Bundle;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
  @Override
  public void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    WebView.setWebContentsDebuggingEnabled(true);

    // Clear WebView cache so new deployments are always picked up
    WebView webView = this.getBridge().getWebView();
    webView.clearCache(true);
    webView.getSettings().setCacheMode(android.webkit.WebSettings.LOAD_NO_CACHE);
  }
}
