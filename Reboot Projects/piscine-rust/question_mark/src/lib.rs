pub struct One {
    pub first_layer: Option<Two>,
}

pub struct Two {
    pub second_layer: Option<Three>,
}

pub struct Three {
    pub third_layer: Option<Four>,
}

pub struct Four {
    pub fourth_layer: Option<u16>,
}

impl One {
    pub fn get_fourth_layer(self) -> Option<u16> {
        let l1 = self.first_layer?;
        let l2 = l1.second_layer?;
        let l3 = l2.third_layer?;
        l3.fourth_layer
    }
}
