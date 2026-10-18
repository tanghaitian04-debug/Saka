package com.tang.video

import org.junit.Assert.*
import org.junit.Test

class LinkPolicyTest {
    @Test fun acceptsSharedText() { assertEquals("https://youtu.be/abc", LinkPolicy.normalize("看看这个 https://youtu.be/abc 分享")) }
    @Test fun acceptsSubdomain() { assertEquals("https://www.bilibili.com/video/BV1", LinkPolicy.normalize("https://www.bilibili.com/video/BV1")) }
    @Test fun rejectsImpostor() { assertThrows(IllegalArgumentException::class.java) { LinkPolicy.normalize("https://youtube.com.evil.example/v") } }
    @Test fun rejectsUserInfo() { assertThrows(IllegalArgumentException::class.java) { LinkPolicy.normalize("https://name@youtube.com/v") } }
    @Test fun rejectsLocalAddress() { assertThrows(IllegalArgumentException::class.java) { LinkPolicy.normalize("https://127.0.0.1/x") } }
    @Test fun filenameCannotEscapeDirectory() { assertEquals(".._.._movie_.mp4", LinkPolicy.filename("../../movie?")) }
}
